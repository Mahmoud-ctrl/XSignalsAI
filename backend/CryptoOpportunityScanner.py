# crypto_scanner.py - Crypto Opportunity Scanner using Binance API
from flask import Flask, jsonify, request
from indicators import compute_indicators
import pandas as pd
import requests
import logging
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

class CryptoOpportunityScanner:
    def __init__(self):
        self.base_url = "https://api.binance.com/api/v3"
        self.session = requests.Session()
        
        # Timeframe mapping for Binance API
        self.timeframe_map = {
            '1m': '1m',
            '3m': '3m', 
            '5m': '5m',
            '15m': '15m',
            '30m': '30m',
            '1h': '1h',
            '2h': '2h',
            '4h': '4h',
            '6h': '6h',
            '8h': '8h',
            '12h': '12h',
            '1d': '1d',
            '3d': '3d',
            '1w': '1w',
            '1M': '1M'
        }
        
        # Signal strength thresholds
        self.signal_thresholds = {
            'STRONG_BUY': 2.0,
            'BUY': 0.8,
            'WEAK_BUY': 0.3,
            'NEUTRAL': 0.0,
            'WEAK_SELL': -0.3,
            'SELL': -0.8,
            'STRONG_SELL': -2.0
        }
    
    def get_binance_klines(self, symbol, timeframe, limit=500):
        """Fetch kline data from Binance API"""
        try:
            url = f"{self.base_url}/klines"
            params = {
                'symbol': symbol,
                'interval': self.timeframe_map.get(timeframe, '1h'),
                'limit': limit
            }
            
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if not data:
                return None
            
            # Convert to DataFrame
            df = pd.DataFrame(data, columns=[
                'timestamp', 'open', 'high', 'low', 'close', 'volume',
                'close_time', 'quote_asset_volume', 'number_of_trades',
                'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'
            ])
            
            # Convert data types
            numeric_columns = ['open', 'high', 'low', 'close', 'volume']
            for col in numeric_columns:
                df[col] = pd.to_numeric(df[col])
            
            # Convert timestamp
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            df.set_index('timestamp', inplace=True)
            
            # Keep only required columns
            df = df[numeric_columns]
            
            return df
            
        except requests.exceptions.RequestException as e:
            logging.error(f"Error fetching data for {symbol}: {e}")
            return None
        except Exception as e:
            logging.error(f"Unexpected error for {symbol}: {e}")
            return None
    
    def analyze_crypto_pair(self, symbol, timeframe='1h'):
        """Analyze a single crypto pair for opportunities"""
        try:
            # Get kline data
            df = self.get_binance_klines(symbol, timeframe)
            
            if df is None or len(df) < 100:  # Need sufficient data
                return {
                    'symbol': symbol,
                    'timeframe': timeframe,
                    'status': 'insufficient_data',
                    'error': 'Not enough data for analysis'
                }
            
            # Compute indicators using the existing system
            latest, analysis, full_df = compute_indicators(df)
            
            if latest is None or analysis is None:
                return {
                    'symbol': symbol,
                    'timeframe': timeframe,
                    'status': 'analysis_failed',
                    'error': 'Technical analysis failed'
                }
            
            # Extract key metrics
            current_price = float(latest['close'])
            signal_data = analysis['overall_signal']
            
            # Enhanced opportunity scoring
            opportunity_score = self.calculate_opportunity_score(latest, analysis)
            
            # Risk assessment
            risk_level = self.assess_risk_level(latest, analysis)
            
            # Market conditions
            market_condition = self.assess_market_condition(latest, analysis)
            
            return {
                'symbol': symbol,
                'timeframe': timeframe,
                'status': 'success',
                'timestamp': datetime.now().isoformat(),
                'current_price': current_price,
                
                # Core signals
                'signal': signal_data['signal'],
                'confidence': round(signal_data['confidence'], 2),
                'score': round(signal_data['score'], 3),
                
                # Enhanced metrics
                'opportunity_score': round(opportunity_score, 3),
                'risk_level': risk_level,
                'market_condition': market_condition,
                
                # Key indicators summary
                'indicators': {
                    'rsi_14': round(float(latest['rsi_14']), 2),
                    'macd_signal': 'bullish' if latest['macd'] > latest['macd_signal'] else 'bearish',
                    'bb_position': round(float(latest['bb_pband_20']), 3),
                    'adx_strength': round(float(latest['adx']), 2),
                    'volume_surge': round(float(latest['volume_momentum']), 2),
                    'trend_strength': analysis['trend_analysis']['strength'],
                    'momentum_strength': analysis['momentum_analysis']['strength']
                },
                
                # Pattern signals
                'patterns': analysis['pattern_analysis']['patterns'],
                
                # Support/Resistance
                'levels': {
                    'support': round(float(latest['support']), 6) if not pd.isna(latest['support']) else None,
                    'resistance': round(float(latest['resistance']), 6) if not pd.isna(latest['resistance']) else None,
                    'current': current_price
                },
                
                # Quick action items
                'actionable': self.is_actionable_opportunity(signal_data, opportunity_score, risk_level),
                'urgency': self.calculate_urgency(analysis, timeframe)
            }
            
        except Exception as e:
            logging.error(f"Error analyzing {symbol}: {e}")
            return {
                'symbol': symbol,
                'timeframe': timeframe,
                'status': 'error',
                'error': str(e)
            }
    
    def calculate_opportunity_score(self, latest, analysis):
        """Calculate enhanced opportunity score"""
        score = 0
        
        # Base signal score
        score += analysis['overall_signal']['score'] * 0.4
        
        # Volatility opportunity (higher volatility = more opportunity)
        bb_width = latest['bb_width_20']
        if bb_width > 0.05:  # High volatility
            score += 0.5
        elif bb_width < 0.02:  # Low volatility
            score -= 0.3
        
        # Volume confirmation
        vol_momentum = latest['volume_momentum']
        if vol_momentum > 2.0:  # Strong volume
            score += 0.8
        elif vol_momentum > 1.5:
            score += 0.4
        elif vol_momentum < 0.5:  # Weak volume
            score -= 0.5
        
        # RSI extremes (contrarian approach)
        rsi = latest['rsi_14']
        if rsi < 25:  # Oversold opportunity
            score += 1.0
        elif rsi > 75:  # Overbought opportunity (for shorts)
            score += 0.8
        elif 45 <= rsi <= 55:  # Neutral zone
            score -= 0.2
        
        # ADX trend strength
        adx = latest['adx']
        if adx > 40:  # Very strong trend
            score += 0.6
        elif adx > 25:  # Strong trend
            score += 0.3
        elif adx < 15:  # Weak trend
            score -= 0.4
        
        # Pattern bonuses
        patterns = analysis['pattern_analysis']['patterns']
        strong_patterns = ['Bullish Engulfing', 'Bearish Engulfing', 'Morning Star', 'Evening Star']
        if any(pattern in ' '.join(patterns) for pattern in strong_patterns):
            score += 0.5
        
        return max(-3.0, min(3.0, score))  # Cap between -3 and 3
    
    def assess_risk_level(self, latest, analysis):
        """Assess risk level for the opportunity"""
        risk_factors = 0
        
        # Volatility risk
        atr_pct = latest['atr_14'] / latest['close']
        if atr_pct > 0.08:  # Very high volatility
            risk_factors += 2
        elif atr_pct > 0.05:  # High volatility
            risk_factors += 1
        
        # Volume risk (low volume = higher risk)
        if latest['volume_momentum'] < 0.5:
            risk_factors += 1
        
        # Support/resistance proximity
        current_price = latest['close']
        if not pd.isna(latest['support']) and not pd.isna(latest['resistance']):
            range_size = latest['resistance'] - latest['support']
            distance_to_support = (current_price - latest['support']) / range_size
            distance_to_resistance = (latest['resistance'] - current_price) / range_size
            
            if min(distance_to_support, distance_to_resistance) < 0.1:
                risk_factors += 1  # Too close to key levels
        
        # Confidence factor
        confidence = analysis['overall_signal']['confidence']
        if confidence < 50:
            risk_factors += 1
        elif confidence < 30:
            risk_factors += 2
        
        # Risk classification
        if risk_factors >= 4:
            return 'VERY_HIGH'
        elif risk_factors >= 3:
            return 'HIGH'
        elif risk_factors >= 2:
            return 'MEDIUM'
        elif risk_factors >= 1:
            return 'LOW'
        else:
            return 'VERY_LOW'
    
    def assess_market_condition(self, latest, analysis):
        """Assess current market condition"""
        regime = latest['market_regime']
        adx = latest['adx']
        bb_width = latest['bb_width_20']
        
        if regime == 1 and adx > 25:
            return 'STRONG_UPTREND'
        elif regime == -1 and adx > 25:
            return 'STRONG_DOWNTREND'
        elif regime == 1 and adx > 15:
            return 'WEAK_UPTREND'
        elif regime == -1 and adx > 15:
            return 'WEAK_DOWNTREND'
        elif bb_width < 0.02:
            return 'CONSOLIDATION'
        elif bb_width > 0.06:
            return 'HIGH_VOLATILITY'
        else:
            return 'SIDEWAYS'
    
    def is_actionable_opportunity(self, signal_data, opportunity_score, risk_level):
        """Determine if this is an actionable opportunity"""
        signal = signal_data['signal']
        confidence = signal_data['confidence']
        
        # Strong signals with good confidence
        if signal in ['STRONG_BUY', 'STRONG_SELL'] and confidence > 70:
            return True
        
        # High opportunity score with acceptable risk
        if opportunity_score > 1.5 and risk_level in ['LOW', 'VERY_LOW', 'MEDIUM']:
            return True
        
        # Medium signals with very high confidence
        if signal in ['BUY', 'SELL'] and confidence > 85:
            return True
        
        return False
    
    def calculate_urgency(self, analysis, timeframe):
        """Calculate urgency based on timeframe and indicators"""
        # Base urgency on timeframe
        timeframe_urgency = {
            '1m': 'IMMEDIATE',
            '3m': 'IMMEDIATE', 
            '5m': 'VERY_HIGH',
            '15m': 'HIGH',
            '30m': 'HIGH',
            '1h': 'MEDIUM',
            '2h': 'MEDIUM',
            '4h': 'LOW',
            '6h': 'LOW',
            '8h': 'LOW',
            '12h': 'VERY_LOW',
            '1d': 'VERY_LOW'
        }
        
        base_urgency = timeframe_urgency.get(timeframe, 'MEDIUM')
        
        # Adjust based on signal strength
        confidence = analysis['overall_signal']['confidence']
        if confidence > 90:
            if base_urgency == 'VERY_LOW':
                return 'LOW'
            elif base_urgency == 'LOW':
                return 'MEDIUM'
            elif base_urgency == 'MEDIUM':
                return 'HIGH'
        
        return base_urgency
    
    def scan_multiple_pairs(self, pairs, timeframe='1h', min_opportunity_score=0.5):
        """Scan multiple crypto pairs for opportunities"""
        opportunities = []
        scan_logs = []  # <-- add logs
        
        logging.info(f"Starting scan for {pairs} pairs on {timeframe} timeframe...")
        logging.info(f"Scanning {len(pairs)} pairs on {timeframe} timeframe...")
        logging.info(f"Minimum opportunity score: {min_opportunity_score}")
        
        # Use ThreadPoolExecutor for parallel processing
        with ThreadPoolExecutor(max_workers=8) as executor:
            future_to_pair = {
                executor.submit(self.analyze_crypto_pair, pair, timeframe): pair 
                for pair in pairs
            }
            
            for future in as_completed(future_to_pair):
                pair = future_to_pair[future]
                try:
                    result = future.result(timeout=30)
                    
                    # Always log scan results (even if below threshold)
                    scan_logs.append({
                        "pair": pair,
                        "opportunity_score": result.get("opportunity_score", 0),
                        "status": result.get("status", "failed"),
                        "kept": (
                            result["status"] == "success" and 
                            result.get("opportunity_score", 0) >= min_opportunity_score
                        )
                    })
                    
                    # Only keep opportunities that pass filters
                    if (result['status'] == 'success' and 
                        result['opportunity_score'] >= min_opportunity_score):
                        
                        result['actionable'] = True
                        opportunities.append(result)
                        
                except Exception as e:
                    logging.error(f"Error processing {pair}: {e}")
                    scan_logs.append({
                        "pair": pair,
                        "status": "error",
                        "error": str(e)
                    })
        
        opportunities.sort(key=lambda x: x['opportunity_score'], reverse=True)
        logging.info(f"Found {len(opportunities)} opportunities")
        
        return opportunities, scan_logs