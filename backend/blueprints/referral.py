from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from models import User, db
import pytz

referral_bp = Blueprint('referral', __name__)

lebanon_tz = pytz.timezone("Asia/Beirut")

@referral_bp.route('/validate-referral', methods=['POST'])
def validate_referral():
    data = request.get_json()
    code = data.get('code')

    if not code:
        return jsonify({'error': 'Referral code is required'}), 400

    user = User.query.filter_by(referral_code=code).first()
    if not user:
        return jsonify({'error': 'Invalid or expired referral code'}), 404

    return jsonify({'message': 'Referral code is valid'}), 200

@referral_bp.route('/referral-code', methods=['GET'])
@jwt_required()
def get_referral_code():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    now = datetime.now()

    # Default values
    remaining_days = 0
    extra_days = 0

    if user.trial_expires_at:
        delta = user.trial_expires_at - now
        remaining_days = max(delta.days, 0)  # don't go negative

        # extra days = (total days granted - base 7)
        base_trial_days = 7
        total_days = (user.trial_expires_at - user.created_at).days
        extra_days = max(total_days - base_trial_days, 0)

    return jsonify({
        'referral_code': user.referral_code,
        'referral_stats': {
            'referrals_count': user.referrals_count,
            'remaining_days': remaining_days,
            'extra_days': extra_days
        }
    }), 200
