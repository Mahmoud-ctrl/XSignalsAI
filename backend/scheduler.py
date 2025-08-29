# scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
import atexit
from models import AISignals, User, Notification, db
import requests
from datetime import datetime, timedelta
import logging
import time
import pytz

lebanon_tz = pytz.timezone("Asia/Beirut")


class SignalScheduler:
    def __init__(self, app=None):
        self.app = app
        self.scheduler = BackgroundScheduler()
        
    def init_app(self, app):
        """Initialize scheduler with Flask app"""
        self.app = app
        
        # Add the job
        self.scheduler.add_job(
            func=self.check_signals,
            trigger="interval", 
            minutes=5,
            id='check_signals',
            replace_existing=True
        )
        
        # Start scheduler
        self.scheduler.start()
        
        # Ensure clean shutdown
        atexit.register(lambda: self.scheduler.shutdown())
        
        logging.info("Signal Scheduler initialized successfully")

    def _create_notification(self, user_id, message):
        """Create a notification for the user"""
        try:
            notification = Notification(
                user_id=user_id,
                message=message,
                is_read=False,
                created_at=datetime.now(lebanon_tz)
            )
            db.session.add(notification)
            # Don't commit here - let the calling method handle the commit
            # This ensures atomicity - either both signal and notification are saved, or neither
            logging.info(f"Created notification for user {user_id}: {message}")
            return notification
        except Exception as e:
            logging.error(f"Error creating notification: {e}")
            # Don't rollback here - let the calling method handle it
            return None

    def check_signals(self):
        """Check active signals for TP/SL hits - runs every 5 minutes"""
        if not self.app:
            logging.error("Flask app not initialized")
            return
            
        with self.app.app_context():
            try:
                active_signals = AISignals.query.filter(
                    AISignals.result.in_(['ACTIVE', 'TP1_HIT', 'TP2_HIT'])
                ).all()
                
                if not active_signals:
                    logging.info("No active signals to check")
                    return
                
                logging.info(f"Checking {len(active_signals)} active signals")
                
                # Group signals by symbol and timeframe to minimize API calls
                symbol_timeframe_groups = {}
                for signal in active_signals:
                    # Extract first timeframe (e.g., "15m" from "15m or 1H")
                    timeframe = signal.timeframe.split(' or ')[0].split(' OR ')[0].strip()
                    key = f"{signal.symbol}_{timeframe}"
                    
                    if key not in symbol_timeframe_groups:
                        symbol_timeframe_groups[key] = []
                    symbol_timeframe_groups[key].append(signal)
                
                # Process each group with one API call
                for key, signals_group in symbol_timeframe_groups.items():
                    self._process_signal_group(key, signals_group)
                    # Add small delay between API calls to avoid rate limiting
                    time.sleep(0.1)
                    
                logging.info("Signal checking completed successfully")
                    
            except Exception as e:
                logging.error(f"Error in check_signals: {e}")
                db.session.rollback()

    def _process_signal_group(self, key, signals_group):
        """Process a group of signals with the same symbol and timeframe"""
        symbol, timeframe = key.split('_')
        
        try:
            # Get the earliest created_at from this group
            earliest_signal = min(signals_group, key=lambda s: s.created_at)
            
            # Convert timeframe to Binance format
            binance_interval = self._convert_timeframe(timeframe)
            
            # Calculate time range - get data from signal creation to now
            start_time = int(earliest_signal.created_at.timestamp() * 1000)
            end_time = int(datetime.now(lebanon_tz).timestamp() * 1000)
            
            # Don't request more than 30 days of data to avoid API limits
            max_time_range = 30 * 24 * 60 * 60 * 1000  # 30 days in milliseconds
            if end_time - start_time > max_time_range:
                start_time = end_time - max_time_range
            
            logging.info(f"Fetching data for {symbol} on {binance_interval} from {datetime.fromtimestamp(start_time/1000)} to {datetime.fromtimestamp(end_time/1000)}")
            
            # Get historical data once for all signals of this symbol+timeframe
            params = {
                'symbol': symbol,
                'interval': binance_interval,
                'startTime': start_time,
                'endTime': end_time,
                'limit': 1000  # Binance limit
            }
            
            klines_response = requests.get(
                'https://api.binance.com/api/v3/klines',
                params=params,
                timeout=10,
                headers={'User-Agent': 'Trading-Bot/1.0'}
            )
            
            logging.info(f"Binance API response status for {symbol}: {klines_response.status_code}")
            
            if klines_response.status_code != 200:
                logging.error(f"Binance API error for {symbol}: {klines_response.status_code}")
                logging.error(f"API Response: {klines_response.text}")
                logging.error(f"Request params: {params}")
                return
                
            klines = klines_response.json()
            
            if not klines or len(klines) == 0:
                # Try different approaches if no data
                logging.warning(f"No klines data for {symbol} with interval {binance_interval}")
                
                # Try getting current price instead
                current_price = self._get_current_price(symbol)
                if current_price:
                    logging.info(f"Got current price for {symbol}: {current_price}")
                    # Check signals against current price only
                    for signal in signals_group:
                        self._check_signal_against_current_price(signal, current_price)
                else:
                    logging.error(f"No price data available for {symbol} - skipping")
                return
            
            logging.info(f"Retrieved {len(klines)} candles for {symbol}")
            
            # Process all signals in this group with the same price data
            for signal in signals_group:
                self._check_signal_against_klines(signal, klines)
                
        except requests.RequestException as e:
            logging.error(f"API request error for {key}: {e}")
        except Exception as e:
            logging.error(f"Error processing signal group {key}: {e}")
            logging.exception("Full traceback:")

    def _get_current_price(self, symbol):
        """Get current price for a symbol as fallback"""
        try:
            response = requests.get(
                f'https://api.binance.com/api/v3/ticker/price',
                params={'symbol': symbol},
                timeout=10,
                headers={'User-Agent': 'Trading-Bot/1.0'}
            )
            
            if response.status_code == 200:
                data = response.json()
                return float(data['price'])
            else:
                logging.error(f"Failed to get current price for {symbol}: {response.status_code}")
                return None
                
        except Exception as e:
            logging.error(f"Error getting current price for {symbol}: {e}")
            return None

    def _check_signal_against_current_price(self, signal, current_price):
        """Check signal against current price only (fallback method)"""
        try:
            signal_updated = False
            old_result = signal.result
            
            # Skip if signal is already completed or stopped out
            if signal.result in ['COMPLETED', 'SL_HIT']:
                return
                
            if signal.primary_signal == 'BUY':
                # Check stop loss first
                if current_price <= signal.stop_loss:
                    signal.result = 'SL_HIT'
                    signal.closed_at = datetime.now(lebanon_tz)
                    signal_updated = True
                    
                    # Create notification for stop loss
                    self._create_notification(
                        signal.user_id,
                        f"🔴 {signal.symbol} signal hit STOP LOSS at ${signal.stop_loss:.6f}"
                    )
                    
                    logging.info(f"Signal {signal.id} ({signal.symbol}) hit stop loss at {signal.stop_loss} (current: {current_price})")
                
                # Check take profits in order
                elif signal.take_profits:
                    for i, tp in enumerate(signal.take_profits):
                        if current_price >= tp and (signal.hit_tp_level is None or signal.hit_tp_level < i + 1):
                            signal.hit_tp_level = i + 1
                            signal.result = f'TP{i + 1}_HIT'
                            signal_updated = True
                            
                            if i + 1 == len(signal.take_profits):  # Last TP
                                signal.result = 'COMPLETED'
                                signal.closed_at = datetime.now(lebanon_tz)
                                
                                # Create notification for completion
                                self._create_notification(
                                    signal.user_id,
                                    f"🎉 {signal.symbol} signal COMPLETED! Hit all targets. Final TP${tp:.6f}"
                                )
                                
                                logging.info(f"Signal {signal.id} ({signal.symbol}) COMPLETED - hit TP{i + 1} at {tp} (current: {current_price})")
                            else:
                                # Create notification for partial TP hit
                                self._create_notification(
                                    signal.user_id,
                                    f"🟢 {signal.symbol} hit Target {i + 1} at ${tp:.6f}"
                                )
                                
                                logging.info(f"Signal {signal.id} ({signal.symbol}) hit TP{i + 1} at {tp} (current: {current_price})")
            
            elif signal.primary_signal == 'SELL':
                # Check stop loss first  
                if current_price >= signal.stop_loss:
                    signal.result = 'SL_HIT'
                    signal.closed_at = datetime.now(lebanon_tz)
                    signal_updated = True
                    
                    # Create notification for stop loss
                    self._create_notification(
                        signal.user_id,
                        f"🔴 {signal.symbol} signal hit STOP LOSS at ${signal.stop_loss:.6f}"
                    )
                    
                    logging.info(f"Signal {signal.id} ({signal.symbol}) hit stop loss at {signal.stop_loss} (current: {current_price})")
                
                # Check take profits in order
                elif signal.take_profits:
                    for i, tp in enumerate(signal.take_profits):
                        if current_price <= tp and (signal.hit_tp_level is None or signal.hit_tp_level < i + 1):
                            signal.hit_tp_level = i + 1
                            signal.result = f'TP{i + 1}_HIT'
                            signal_updated = True
                            
                            if i + 1 == len(signal.take_profits):  # Last TP
                                signal.result = 'COMPLETED'
                                signal.closed_at = datetime.now(lebanon_tz)
                                
                                # Create notification for completion
                                self._create_notification(
                                    signal.user_id,
                                    f"🎉 {signal.symbol} signal COMPLETED! Hit all targets. Final TP${tp:.6f}"
                                )
                                
                                logging.info(f"Signal {signal.id} ({signal.symbol}) COMPLETED - hit TP{i + 1} at {tp} (current: {current_price})")
                            else:
                                # Create notification for partial TP hit
                                self._create_notification(
                                    signal.user_id,
                                    f"🟢 {signal.symbol} hit Target {i + 1} at ${tp:.6f}"
                                )
                                
                                logging.info(f"Signal {signal.id} ({signal.symbol}) hit TP{i + 1} at {tp} (current: {current_price})")
            
            # Update timestamp and commit if signal was modified
            if signal_updated:
                signal.updated_at = datetime.now(lebanon_tz)
                try:
                    db.session.commit()  # This commits BOTH the signal update AND the notification
                    logging.info(f"Successfully committed signal {signal.id} update and notification to database")
                except Exception as commit_error:
                    logging.error(f"Error committing signal {signal.id} and notification: {commit_error}")
                    db.session.rollback()
                    
        except Exception as e:
            logging.error(f"Error processing signal {signal.id} against current price: {e}")
            db.session.rollback()

    def _check_signal_against_klines(self, signal, klines):
        """Check individual signal against price data"""
        try:
            signal_start_time = int(signal.created_at.timestamp() * 1000)
            signal_updated = False
            old_result = signal.result
            
            for candle in klines:
                candle_time = int(candle[0])  # Open time
                
                # Only check candles after signal creation
                if candle_time < signal_start_time:
                    continue
                
                # Skip if signal is already completed or stopped out
                if signal.result in ['COMPLETED', 'SL_HIT']:
                    break
                    
                high_price = float(candle[2])
                low_price = float(candle[3])
                
                if signal.primary_signal == 'BUY':
                    # Check stop loss first
                    if low_price <= signal.stop_loss:
                        signal.result = 'SL_HIT'
                        signal.closed_at = datetime.now(lebanon_tz)
                        signal_updated = True
                        
                        # Create notification for stop loss
                        self._create_notification(
                            signal.user_id,
                            f"🔴 {signal.symbol} signal hit STOP LOSS at ${signal.stop_loss:.6f}"
                        )
                        
                        logging.info(f"Signal {signal.id} ({signal.symbol}) hit stop loss at {signal.stop_loss}")

                        try:
                            db.session.commit()
                            logging.info(f"Signal {signal.id} ({signal.symbol}) stopped out at {low_price}")
                        except Exception as e:
                            logging.error(f"Error updating signal {signal.id} ({signal.symbol}): {e}")
                            db.session.rollback()
                        break
                    
                    # Check take profits in order
                    if signal.take_profits:
                        for i, tp in enumerate(signal.take_profits):
                            if high_price >= tp and (signal.hit_tp_level is None or signal.hit_tp_level < i + 1):
                                signal.hit_tp_level = i + 1
                                signal.result = f'TP{i + 1}_HIT'
                                signal_updated = True
                                
                                if i + 1 == len(signal.take_profits):  # Last TP
                                    signal.result = 'COMPLETED'
                                    signal.closed_at = datetime.now(lebanon_tz)
                                    
                                    # Create notification for completion
                                    self._create_notification(
                                        signal.user_id,
                                        f"🎉 {signal.symbol} signal COMPLETED! Hit all targets. Final TP${tp:.6f}"
                                    )
                                    
                                    logging.info(f"Signal {signal.id} ({signal.symbol}) COMPLETED - hit TP{i + 1} at {tp}")

                                    try:
                                        db.session.commit()
                                        logging.info(f"Signal {signal.id} ({signal.symbol}) stopped out at {high_price}")
                                        return
                                    except Exception as e:
                                        logging.error(f"Error updating signal {signal.id} ({signal.symbol}): {e}")
                                        db.session.rollback()
                                        return
                                else:
                                    # Create notification for partial TP hit
                                    self._create_notification(
                                        signal.user_id,
                                        f"🟢 {signal.symbol} hit Target {i + 1} at ${tp:.6f}"
                                    )
                                    
                                    logging.info(f"Signal {signal.id} ({signal.symbol}) hit TP{i + 1} at {tp}")

                                try:
                                    db.session.commit()
                                    logging.info(f"Signal {signal.id} ({signal.symbol}) stopped out at {high_price}")
                                except Exception as e:
                                    logging.error(f"Error updating signal {signal.id} ({signal.symbol}): {e}")
                                    db.session.rollback()

                elif signal.primary_signal == 'SELL':
                    # Check stop loss first  
                    if high_price >= signal.stop_loss:
                        signal.result = 'SL_HIT'
                        signal.closed_at = datetime.now(lebanon_tz)
                        signal_updated = True
                        
                        # Create notification for stop loss
                        self._create_notification(
                            signal.user_id,
                            f"🔴 {signal.symbol} signal hit STOP LOSS at ${signal.stop_loss:.6f}"
                        )
                        
                        logging.info(f"Signal {signal.id} ({signal.symbol}) hit stop loss at {signal.stop_loss}")

                        try:
                            db.session.commit()
                            logging.info(f"Signal {signal.id} ({signal.symbol}) stopped out at {high_price}")
                        except Exception as e:
                            logging.error(f"Error updating signal {signal.id} ({signal.symbol}): {e}")
                            db.session.rollback()
                        break
                    
                    # Check take profits in order
                    if signal.take_profits:
                        for i, tp in enumerate(signal.take_profits):
                            if low_price <= tp and (signal.hit_tp_level is None or signal.hit_tp_level < i + 1):
                                signal.hit_tp_level = i + 1
                                signal.result = f'TP{i + 1}_HIT'
                                signal_updated = True
                                
                                if i + 1 == len(signal.take_profits):  # Last TP
                                    signal.result = 'COMPLETED'
                                    signal.closed_at = datetime.now(lebanon_tz)
                                    
                                    # Create notification for completion
                                    self._create_notification(
                                        signal.user_id,
                                        f"🎉 {signal.symbol} signal COMPLETED! Hit all targets. Final TP${tp:.6f}"
                                    )
                                    
                                    logging.info(f"Signal {signal.id} ({signal.symbol}) COMPLETED - hit TP{i + 1} at {tp}")

                                    try:
                                        db.session.commit()
                                        logging.info(f"Signal {signal.id} ({signal.symbol}) stopped out at {low_price}")
                                        return
                                    except Exception as e:
                                        logging.error(f"Error updating signal {signal.id} ({signal.symbol}): {e}")
                                        db.session.rollback()
                                        return
                                else:
                                    # Create notification for partial TP hit
                                    self._create_notification(
                                        signal.user_id,
                                        f"🟢 {signal.symbol} hit Target {i + 1} at ${tp:.6f}"
                                    )
                                    
                                    logging.info(f"Signal {signal.id} ({signal.symbol}) hit TP{i + 1} at {tp}")

                                    try:
                                        db.session.commit()
                                        logging.info(f"Signal {signal.id} ({signal.symbol}) stopped out at {low_price}")
                                    except Exception as e:
                                        logging.error(f"Error updating signal {signal.id} ({signal.symbol}): {e}")
                                        db.session.rollback()
            
            # Update timestamp and commit if signal was modified
            if signal_updated:
                try:
                    db.session.commit()
                    logging.info(f"Fallback commit successful for signal {signal.id}")
                except Exception as commit_error:
                    logging.error(f"Fallback commit failed for signal {signal.id}: {commit_error}")
                    db.session.rollback()
                    
        except Exception as e:
            logging.error(f"Error processing signal {signal.id}: {e}")
            logging.exception("Full traceback:")
            db.session.rollback()

    def _convert_timeframe(self, timeframe):
        """Convert timeframe format to Binance API format"""
        # Handle different possible formats
        timeframe = timeframe.upper().strip()
        
        # Direct mappings for all possible formats
        conversion_map = {
            # Standard formats
            '1M': '1m', '5M': '5m', '15M': '15m', '30M': '30m',
            '1H': '1h', '2H': '2h', '4H': '4h', '6H': '6h', '8H': '8h', '12H': '12h',
            '1D': '1d', '3D': '3d', '1W': '1w', '1MO': '1M',
            # Text formats with dashes
            '1-MINUTE': '1m', '5-MINUTE': '5m', '15-MINUTE': '15m', '30-MINUTE': '30m',
            '1-HOUR': '1h', '2-HOUR': '2h', '4-HOUR': '4h', '6-HOUR': '6h', '8-HOUR': '8h', '12-HOUR': '12h',
            '1-DAY': '1d', '3-DAY': '3d', '1-WEEK': '1w',
            # Text formats without dashes
            '1MINUTE': '1m', '5MINUTE': '5m', '15MINUTE': '15m', '30MINUTE': '30m',
            '1HOUR': '1h', '2HOUR': '2h', '4HOUR': '4h', '6HOUR': '6h', '8HOUR': '8h', '12HOUR': '12h',
            '1DAY': '1d', '3DAY': '3d', '1WEEK': '1w',
            # Abbreviations
            '15MIN': '15m', '30MIN': '30m', '1HR': '1h', '2HR': '2h', '4HR': '4h'
        }
        
        result = conversion_map.get(timeframe, timeframe.lower())
        
        # Fallback: if it's already in correct format (like "15m"), return as-is
        if result == timeframe.lower() and any(c.isdigit() for c in result):
            return result
            
        return result if result in ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'] else '1h'

    def shutdown(self):
        """Manually shutdown the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logging.info("Signal Scheduler shutdown")

class TrialManager:
    def __init__(self, app=None):
        self.app = app
        self.scheduler = BackgroundScheduler()
        
    def init_app(self, app):
        self.app = app
        
        # Add the job
        self.scheduler.add_job(
            func=self.expire_trials,
            trigger="interval", 
            hours=24,
            id='expire_trials',
            replace_existing=True
        )
        
        # Start scheduler
        self.scheduler.start()
        
        # Ensure clean shutdown
        atexit.register(lambda: self.scheduler.shutdown())
        
        logging.info("Signal Scheduler initialized successfully")

    @staticmethod
    def expire_trials():
        """Check all users and downgrade those whose trials expired."""
        now = datetime.now(lebanon_tz)
        expired_users = User.query.filter(
            User.trial_expires_at < now,
            User.tier != 'free'
        ).all()

        for user in expired_users:
            user.tier = 'free'
            db.session.add(user)

        if expired_users:
            db.session.commit()
            print(f"[TrialManager] Downgraded {len(expired_users)} expired users.")
        else:
            print("[TrialManager] No expired trials found.")

class SubscriptionManager:
    def __init__(self, app=None):
        self.app = app
        self.scheduler = BackgroundScheduler()
        
    def init_app(self, app):
        """Initialize subscription manager with Flask app"""
        self.app = app
        
        # Check subscriptions every 6 hours
        self.scheduler.add_job(
            func=self.check_subscription_expiry,
            trigger="interval", 
            hours=6,
            id='check_subscription_expiry',
            replace_existing=True
        )
        
        # Also check once daily for grace period notifications
        self.scheduler.add_job(
            func=self.send_expiry_warnings,
            trigger="interval", 
            hours=24,
            id='send_expiry_warnings',
            replace_existing=True
        )
        
        # Start scheduler
        self.scheduler.start()
        
        # Ensure clean shutdown
        atexit.register(lambda: self.scheduler.shutdown())
        
        logging.info("Subscription Manager initialized successfully")

    def check_subscription_expiry(self):
        """Check all users and downgrade those whose subscriptions expired"""
        if not self.app:
            logging.error("Flask app not initialized")
            return
            
        with self.app.app_context():
            try:
                now = datetime.now(lebanon_tz)
                
                # Find users whose subscriptions have expired
                expired_users = User.query.filter(
                    User.plan_expires_at < now,
                    User.tier != 'free',
                    User.plan_expires_at.isnot(None)  # Only check users with subscription dates
                ).all()
                
                if not expired_users:
                    logging.info("No expired subscriptions found")
                    return
                
                logging.info(f"Found {len(expired_users)} users with expired subscriptions")
                
                for user in expired_users:
                    old_tier = user.tier
                    user.tier = 'free'
                    user.plan_expires_at = None  # Clear the expiry date
                    
                    # Create notification for the user
                    self._create_subscription_notification(
                        user.id,
                        f"💳 Your {old_tier.title()} subscription has expired. You've been moved to the Free plan. Upgrade anytime to continue enjoying premium features!"
                    )
                    
                    logging.info(f"Downgraded user {user.id} ({user.email}) from {old_tier} to free")
                
                # Commit all changes
                db.session.commit()
                logging.info(f"Successfully downgraded {len(expired_users)} expired subscriptions")
                
            except Exception as e:
                logging.error(f"Error in check_subscription_expiry: {e}")
                logging.exception("Full traceback:")
                db.session.rollback()

    def send_expiry_warnings(self):
        """Send warning notifications to users whose subscriptions will expire soon"""
        if not self.app:
            logging.error("Flask app not initialized")
            return
            
        with self.app.app_context():
            try:
                now = datetime.now(lebanon_tz)
                
                # Find users whose subscriptions expire in 3 days
                warning_date = now + timedelta(days=3)
                
                users_expiring_soon = User.query.filter(
                    User.plan_expires_at <= warning_date,
                    User.plan_expires_at > now,  # Not expired yet
                    User.tier != 'free',
                    User.plan_expires_at.isnot(None)
                ).all()
                
                if not users_expiring_soon:
                    logging.info("No subscriptions expiring in the next 3 days")
                    return
                
                logging.info(f"Found {len(users_expiring_soon)} users with subscriptions expiring soon")
                
                for user in users_expiring_soon:
                    days_left = (user.plan_expires_at - now).days
                    
                    if days_left <= 0:
                        continue  # Skip if already expired (edge case)
                    
                    # Check if we've already sent a warning recently (avoid spam)
                    recent_warning = Notification.query.filter(
                        Notification.user_id == user.id,
                        Notification.message.like('%subscription expires%'),
                        Notification.created_at > now - timedelta(days=1)
                    ).first()
                    
                    if recent_warning:
                        continue  # Skip if we already warned them today
                    
                    self._create_subscription_notification(
                        user.id,
                        f"⚠️ Your {user.tier.title()} subscription expires in {days_left} day{'s' if days_left != 1 else ''}. Renew now to avoid interruption!"
                    )
                    
                    logging.info(f"Sent expiry warning to user {user.id} ({user.email}) - {days_left} days left")
                
                # Commit all notifications
                db.session.commit()
                logging.info(f"Sent expiry warnings to {len(users_expiring_soon)} users")
                
            except Exception as e:
                logging.error(f"Error in send_expiry_warnings: {e}")
                logging.exception("Full traceback:")
                db.session.rollback()

    def _create_subscription_notification(self, user_id, message):
        """Create a subscription-related notification for the user"""
        try:
            notification = Notification(
                user_id=user_id,
                message=message,
                is_read=False,
                created_at=datetime.now(lebanon_tz)
            )
            db.session.add(notification)
            logging.info(f"Created subscription notification for user {user_id}: {message}")
            return notification
        except Exception as e:
            logging.error(f"Error creating subscription notification: {e}")
            return None

    def shutdown(self):
        """Manually shutdown the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logging.info("Subscription Manager shutdown")

# Initialize the scheduler instance
signal_scheduler = SignalScheduler()
# Initialize the TrialManager instance
trial_manager = TrialManager()
# Initialize the SubscriptionManager instance
subscription_manager = SubscriptionManager()

def init_scheduler(app):
    """Initialize scheduler with Flask app"""
    signal_scheduler.init_app(app)
    trial_manager.init_app(app)
    subscription_manager.init_app(app)