import random
import string
import uuid
from flask import Blueprint, jsonify, make_response, request, current_app
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, set_access_cookies
from models import db, User
from schemas import LoginSchema, SignupSchema, RequestPasswordResetSchema, ResetPasswordSchema, ChangePasswordSchema
import requests
from datetime import datetime, timedelta
import pytz

auth_bp = Blueprint('auth', __name__)
lebanon_tz = pytz.timezone('Asia/Beirut')

def generate_referral_code(length=6):
    """Generate a random alphanumeric referral code."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def apply_referral_reward(user: User):
    """
    Balanced referral reward system:
    - Every referral = +24 hours (1 day).
    - At milestones (3, 5, 10 referrals) → small bonus.
    - Rewards always stack relative to current expiry.
    - Hard cap = 14 days extra (so it never replaces full Pro).
    """
    count = user.referrals_count
    now = datetime.now(lebanon_tz)

    # Current expiry (start from now if already expired)
    current_expiry = user.trial_expires_at or now
    if current_expiry < now:
        current_expiry = now

    # Base reward: +1 day per referral
    extra_days = 1

    # Small milestone bonuses
    if count == 3:
        extra_days += 2   # +2 bonus days
    elif count == 5:
        extra_days += 3   # +3 bonus days
    elif count == 10:
        extra_days += 5   # +5 bonus days

    # Apply reward
    user.trial_expires_at = current_expiry + timedelta(days=extra_days)

    # Cap at +14 days beyond original trial
    max_expiry = user.created_at + timedelta(days=7 + 14)  # 7d base +14d referrals
    if user.trial_expires_at > max_expiry:
        user.trial_expires_at = max_expiry

@auth_bp.route('/signup', methods=['POST'])
def signup():
    try:
        # Validate input
        data = SignupSchema().load(request.json)
    except ValidationError as err:
        return jsonify({'error': err.messages}), 400

    name = data['username']
    email = data['email']
    password = data['password']
    promo_code = data.get('promo')  # this could also come from ?promo=XYZ in URL

    # Check for duplicates
    if User.query.filter((User.email == email) | (User.name == name)).first():
        return jsonify({'error': 'Email or username already registered'}), 400

    # Hash password
    hashed_password = generate_password_hash(password)

    # Generate and send email confirmation code
    confirmation_code = current_app.auth_handler.generate_confirmation_code()
    current_app.auth_handler.send_confirmation_email(email, confirmation_code)

    # Create new user
    new_user = User(
        name=name,
        email=email,
        password=hashed_password,
        tier='pro',
        is_email_verified=False,
        auth_provider='email',
        referral_code=generate_referral_code(),
        trial_expires_at=datetime.now(lebanon_tz) + timedelta(days=3)
    )

    # Handle referral if promo_code provided
    if promo_code:
        inviter = User.query.filter_by(referral_code=promo_code).first()
        if inviter and inviter.email != email:
            new_user.referred_by = inviter.id
            inviter.referrals_count += 1
            apply_referral_reward(inviter)
            db.session.add(inviter)

    db.session.add(new_user)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Email or username already registered'}), 400

    return jsonify({'message': 'User registered. Verify your email.'}), 201

# Verify Email Route
@auth_bp.route('/verify', methods=['POST'])
def verify():
    data = request.json
    email = data.get('email')
    code = data.get('code')

    if not email or not code:
        return jsonify({'error': 'Email and code are required'}), 400

    if current_app.auth_handler.verify_code(email, code):
        user = User.query.filter_by(email=email).first()
        if user:
            user.is_email_verified = True
            db.session.commit()
            return jsonify({'message': 'Email verified successfully'}), 200
    
    return jsonify({'error': 'Invalid confirmation code'}), 400

# Login Route
@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = LoginSchema().load(request.json)
    except ValidationError as err:
        return jsonify({'error': err.messages}), 400

    identifier = data.get('email')
    password = data['password']

    user = User.query.filter(
        (User.email == identifier)
    ).first()

    if not user:
        return jsonify({'error': 'Invalid login credentials'}), 401
    
    if not user.is_email_verified:
        return jsonify({'error': 'Please verify your email before logging in'}), 401
    
    if not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid login credentials'}), 401

    access_token = create_access_token(identity=str(user.id), expires_delta=timedelta(hours=1))
    
    # Create response with cookie
    response_data = {
        'message': 'Login successful',
        'user': {
            'id': user.id,
            'username': user.name,
            'email': user.email,
            'tier': user.tier
        }
    }
    
    response = make_response(jsonify(response_data), 200)
    
    set_access_cookies(response, access_token)
    return response

# Google Login Route
@auth_bp.route('/google-auth', methods=['POST'])
def google_auth():
    data = request.json
    credential = data.get('credential')
    promo_code = data.get('promo')  # Handle promo code

    # Verify Google token
    try:
        idinfo = requests.get(
            f'https://oauth2.googleapis.com/tokeninfo?id_token={credential}'
        ).json()

        if 'error' in idinfo:
            return jsonify({'error': 'Invalid Google token'}), 401

        # Validate issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            return jsonify({'error': 'Invalid issuer'}), 401

        # Extract user info
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        google_id = idinfo['sub']

    except Exception:
        return jsonify({'error': 'Token verification failed'}), 401

    # Check if user exists
    user = User.query.filter_by(email=email).first()
    is_new_user = False
    lebanon_tz = pytz.timezone("Asia/Beirut")

    if not user:
        user = User(
            name=name,
            email=email,
            password=generate_password_hash(str(uuid.uuid4())),
            is_email_verified=True,
            auth_provider='google',
            google_id=google_id,
            tier='pro',  # Set tier to Pro for new users
            last_login=datetime.now(tz=lebanon_tz),
            referral_code=generate_referral_code(),
            trial_expires_at=datetime.now(lebanon_tz) + timedelta(days=7)
        )

        # Handle referral if promo_code provided
        if promo_code:
            inviter = User.query.filter_by(referral_code=promo_code).first()
            if inviter and inviter.email != email:
                user.referred_by = inviter.id
                inviter.referrals_count += 1
                apply_referral_reward(inviter)
                db.session.add(inviter)

        db.session.add(user)
        try:
            db.session.commit()
            is_new_user = True
        except IntegrityError:
            db.session.rollback()
            return jsonify({'error': 'User already exists'}), 400
    else:
        user.last_login = datetime.now(tz=lebanon_tz)
        db.session.commit()

    access_token = create_access_token(identity=str(user.id), expires_delta=timedelta(days=1))
    
    response_data = {
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'tier': user.tier,
        },
        'is_new_user': is_new_user
    }
    
    response = make_response(jsonify(response_data), 200)
    set_access_cookies(response, access_token)
    return response

# Request Password Reset Route
@auth_bp.route('/request-password-reset', methods=['POST'])
def request_password_reset():
    try:
        # Import the schema at the top of your file: from schemas import RequestPasswordResetSchema
        data = RequestPasswordResetSchema().load(request.json)
        email = data['email']
        
        # Check if user exists
        user = User.query.filter_by(email=email).first()
        
        # Always return success message for security (don't reveal if email exists)
        if user:
            # Generate and send password reset code
            reset_code = current_app.auth_handler.generate_confirmation_code()
            current_app.auth_handler.send_password_reset_email(email, reset_code)
            
        return jsonify({'message': 'If the email exists, a password reset code has been sent'}), 200
    except ValidationError as err:
        return jsonify({'error': err.messages}), 400
    except Exception as e:
        current_app.logger.error(f"Password reset error: {str(e)}")
        return jsonify({'error': 'Failed to process password reset request'}), 500


# Reset Password Route
@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        # Import the schema at the top of your file: from schemas import ResetPasswordSchema
        data = ResetPasswordSchema().load(request.json)
        email = data['email']
        code = data['code']
        new_password = data['password']
        
        # Verify the reset code (use separate method for reset codes)
        if not current_app.auth_handler.verify_reset_code(email, code):
            return jsonify({'error': 'Invalid or expired reset code'}), 400
        
        # Find user
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update password
        user.password = generate_password_hash(new_password)
        db.session.commit()
        
        return jsonify({'message': 'Password reset successfully'}), 200
    except ValidationError as err:
        return jsonify({'error': err.messages}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to reset password'}), 500


# Change Password Route (for logged-in users)
@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    try:
        # Import the schema at the top of your file: from schemas import ChangePasswordSchema
        data = ChangePasswordSchema().load(request.json)
        current_password = data['current_password']
        new_password = data['new_password']
        
        # Get current user
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Verify current password (skip for Google auth users who don't have a real password)
        if user.auth_provider == 'email' and not check_password_hash(user.password, current_password):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        # Update password
        user.password = generate_password_hash(new_password)
        user.auth_provider = 'email'  # Switch to email auth if they were Google auth
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
    except ValidationError as err:
        return jsonify({'error': err.messages}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to change password'}), 500
    
# Add logout route to clear cookie
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    response = make_response(jsonify({'message': 'Logged out successfully'}), 200)
    response.set_cookie(
        'access_token',
        '',
        expires=0,  # Expire immediately
        httponly=True,
        secure=True,
        samesite='Strict'
    )
    return response

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user': {
            'id': user.id,
            'username': user.name,
            'email': user.email,
            'tier': user.tier
        }
    }), 200

# Check user auth
@auth_bp.route('/check-auth', methods=['GET'])
@jwt_required()
def check_auth():
    user_id = get_jwt_identity()
    current_app.logger.info(f"Authenticated user ID: {user_id}")
    return jsonify({"authenticated": True}), 200