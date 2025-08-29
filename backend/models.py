# models.py
from datetime import datetime, timedelta
import pytz
from flask_sqlalchemy import SQLAlchemy

lebanon_tz = pytz.timezone("Asia/Beirut")
db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'  # <-- double underscores
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(lebanon_tz))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(lebanon_tz), onupdate=lambda: datetime.now(lebanon_tz))
    last_login = db.Column(db.DateTime, nullable=True)
    is_email_verified = db.Column(db.Boolean, default=False)

    tier = db.Column(db.String(20), default='free')  # free, premium, pro
    plan_expires_at = db.Column(db.DateTime, nullable=True)  # <-- NEW

    google_id = db.Column(db.String(255), nullable=True)
    auth_provider = db.Column(db.String(50), default='email')
    referral_code = db.Column(db.String(10), unique=True, nullable=False)
    referred_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    referrals_count = db.Column(db.Integer, default=0)
    trial_expires_at = db.Column(db.DateTime, default=lambda: datetime.now(lebanon_tz) + timedelta(days=7))


class AISignals(db.Model):
    __tablename__ = 'ai_signals'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    symbol = db.Column(db.String(20), nullable=False)
    timeframe = db.Column(db.String(10), nullable=False)
    primary_signal = db.Column(db.String(10), nullable=False)  # BUY / SELL
    confidence = db.Column(db.Integer, nullable=True)
    entry_zone_low = db.Column(db.Float, nullable=False)
    entry_zone_high = db.Column(db.Float, nullable=False)
    stop_loss = db.Column(db.Float, nullable=False)
    take_profits = db.Column(db.ARRAY(db.Float), nullable=True)
    entry_status = db.Column(db.String(30), nullable=False, default="WAIT_FOR_PULLBACK")
    result = db.Column(db.String(20), nullable=True)
    hit_tp_level = db.Column(db.Integer, nullable=True)
    closed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(lebanon_tz))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(lebanon_tz), onupdate=lambda: datetime.now(lebanon_tz))


class Admin(db.Model):
    __tablename__ = 'admins'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    # set_password / check_password as you already had


class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(lebanon_tz))
    user = db.relationship('User', backref=db.backref('notifications', lazy=True))

# NEW: Transaction ledger
class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    plan = db.Column(db.String(50), nullable=False)
    amount_usd = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')
    payment_method = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
    confirmed_at = db.Column(db.DateTime)
    
    # NEW NOWPayments fields
    nowpayments_payment_id = db.Column(db.String(255), unique=True)
    pay_currency = db.Column(db.String(10))  # btc, eth, usdt, etc.
    pay_amount = db.Column(db.Float)  # Amount in crypto
    pay_address = db.Column(db.String(255))  # Crypto address to send to
    payment_url = db.Column(db.Text)  # NOWPayments hosted checkout URL
    order_id = db.Column(db.String(255), unique=True)  # Our internal order reference

    user = db.relationship('User', backref='transactions')


# NEW: To ensure webhook idempotency (don’t process same event twice)
class WebhookEvent(db.Model):
    __tablename__ = 'webhook_events'
    id = db.Column(db.Integer, primary_key=True)
    provider = db.Column(db.String(50), nullable=False)   # 'coinbase'
    event_id = db.Column(db.String(128), unique=True, nullable=False)
    received_at = db.Column(db.DateTime, default=lambda: datetime.now(lebanon_tz))
