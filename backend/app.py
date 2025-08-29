from datetime import timedelta
from flask import Flask
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_mail import Mail
from config import Config
from auth import UserRegistration
from scheduler import init_scheduler
from blueprints.auth import auth_bp
from blueprints.scan import scan_bp
from blueprints.notifications import notifications_bp
from blueprints.referral import referral_bp
from blueprints.reports import reports_bp
from blueprints.payments import payments_bp
from blueprints.billing import billing_bp
import pytz
from models import db
from celery import Celery

load_dotenv()

app = Flask(__name__)
jwt = JWTManager(app)
app.config.from_object(Config)
db.init_app(app)
lebanon_tz = pytz.timezone("Asia/Beirut")

# JWT Configuration
app.config["JWT_SECRET_KEY"] = '1289'
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=3000)

# JWT Cookie Configuration (add these lines)
app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['JWT_COOKIE_SECURE'] = False  # Enable for production (HTTPS)
app.config['JWT_COOKIE_SAMESITE'] = 'Lax'  # CSRF protection
app.config["JWT_CSRF_IN_COOKIES"] = True
app.config['JWT_ACCESS_COOKIE_NAME'] = 'access_token'
app.config['JWT_COOKIE_HTTPONLY'] = True
app.config["JWT_ACCESS_COOKIE_PATH"] = "/"
app.config["JWT_CSRF_COOKIE_PATH"] = "/"

# Flask-Mail configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_USERNAME'] = 'baderaldinmahmud@gmail.com'
app.config['MAIL_PASSWORD'] = 'gfww lkbt qdph zvyz'
app.config['MAIL_DEFAULT_SENDER'] = 'baderaldinmahmud@gmail.com'
mail = Mail(app)

from celery_app import celery
app.extensions['celery'] = celery

limiter = Limiter(
    get_remote_address,
    storage_uri="redis://default:DqWEX2Ln31uswDcUc3iqu6IFn40vEU8n@redis-19994.c328.europe-west3-1.gce.redns.redis-cloud.com:19994",
)
limiter.init_app(app)

CORS(
    app,
    supports_credentials=True,
    allow_headers=["Authorization", "Content-Type", "X-CSRF-TOKEN"],
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://192.168.0.108:5173",
                "http://192.168.56.1:5173",
            ],
            "allow_headers": ["Authorization", "Content-Type", "X-CSRF-TOKEN"],
            "expose_headers": ["Authorization"],
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
        },
    }
)

# Create UserRegistration instance
auth_handler = UserRegistration(app)
app.auth_handler = auth_handler

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(scan_bp, url_prefix='/api')
app.register_blueprint(notifications_bp, url_prefix='/api')
app.register_blueprint(referral_bp, url_prefix='/api')
app.register_blueprint(reports_bp)
app.register_blueprint(payments_bp)
app.register_blueprint(billing_bp)

def register_comprehensive_analysis_bp():
    from blueprints.comprehensive_analysis import comprehensive_analysis_bp
    app.register_blueprint(comprehensive_analysis_bp, url_prefix='/api')

# Register comprehensive_analysis_bp after all imports
register_comprehensive_analysis_bp()

if __name__ == '__main__':
    # Initialize scheduler
    init_scheduler(app)
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)