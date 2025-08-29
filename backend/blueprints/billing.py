from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import desc, func
from models import User, Transaction, db  # Adjust import path as needed

billing_bp = Blueprint('billing', __name__, url_prefix='/api/billing')

@billing_bp.route('/plan', methods=['GET'])
@jwt_required()
def get_current_plan():
    """Get current user's plan details"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if plan is expired
        now = datetime.now()
        is_expired = user.plan_expires_at and user.plan_expires_at < now
        is_trial_expired = user.trial_expires_at and user.trial_expires_at < now
        
        # Determine effective tier
        effective_tier = 'free' if (is_expired and is_trial_expired) else user.tier
        
        plan_data = {
            'current_tier': user.tier,
            'effective_tier': effective_tier,
            'plan_expires_at': user.plan_expires_at.isoformat() if user.plan_expires_at else None,
            'trial_expires_at': user.trial_expires_at.isoformat() if user.trial_expires_at else None,
            'is_plan_expired': is_expired,
            'is_trial_expired': is_trial_expired,
            'days_until_expiry': None,
            'is_on_trial': user.tier == 'free' and not is_trial_expired,
            'created_at': user.created_at.isoformat()
        }
        
        # Calculate days until expiry
        if user.plan_expires_at and not is_expired:
            days_left = (user.plan_expires_at - now).days
            plan_data['days_until_expiry'] = max(0, days_left)
        elif user.trial_expires_at and not is_trial_expired and user.tier == 'free':
            days_left = (user.trial_expires_at - now).days
            plan_data['days_until_expiry'] = max(0, days_left)
        
        return jsonify({
            'success': True,
            'data': plan_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch plan details', 'message': str(e)}), 500


@billing_bp.route('/history', methods=['GET'])
@jwt_required()
def get_billing_history():
    """Get user's billing/transaction history"""
    try:
        user_id = get_jwt_identity()
        
        # Pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 100)
        status_filter = request.args.get('status')  # pending, confirmed, failed, etc.
        
        # Build query
        query = Transaction.query.filter_by(user_id=user_id)
        
        if status_filter:
            query = query.filter(Transaction.status == status_filter)
        
        # Order by most recent first
        query = query.order_by(desc(Transaction.created_at))
        
        # Paginate
        transactions = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        transaction_list = []
        for txn in transactions.items:
            transaction_data = {
                'id': txn.id,
                'plan': txn.plan,
                'amount_usd': txn.amount_usd,
                'status': txn.status,
                'payment_method': txn.payment_method,
                'created_at': txn.created_at.isoformat(),
                'confirmed_at': txn.confirmed_at.isoformat() if txn.confirmed_at else None,
                'pay_currency': txn.pay_currency,
                'pay_amount': txn.pay_amount,
                'order_id': txn.order_id
            }
            transaction_list.append(transaction_data)
        
        return jsonify({
            'success': True,
            'data': {
                'transactions': transaction_list,
                'pagination': {
                    'page': transactions.page,
                    'pages': transactions.pages,
                    'per_page': transactions.per_page,
                    'total': transactions.total,
                    'has_next': transactions.has_next,
                    'has_prev': transactions.has_prev
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch billing history', 'message': str(e)}), 500


@billing_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_billing_summary():
    """Get billing summary statistics"""
    try:
        user_id = get_jwt_identity()
        
        # Get total spent (confirmed transactions only)
        total_spent = db.session.query(func.sum(Transaction.amount_usd))\
            .filter_by(user_id=user_id, status='confirmed')\
            .scalar() or 0.0
        
        # Get transaction counts by status
        status_counts = db.session.query(
            Transaction.status,
            func.count(Transaction.id)
        ).filter_by(user_id=user_id)\
         .group_by(Transaction.status)\
         .all()
        
        status_summary = {status: count for status, count in status_counts}
        
        # Get recent transactions count (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_transactions = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.created_at >= thirty_days_ago
        ).count()
        
        # Get last transaction
        last_transaction = Transaction.query.filter_by(user_id=user_id)\
            .order_by(desc(Transaction.created_at))\
            .first()
        
        last_transaction_data = None
        if last_transaction:
            last_transaction_data = {
                'id': last_transaction.id,
                'plan': last_transaction.plan,
                'amount_usd': last_transaction.amount_usd,
                'status': last_transaction.status,
                'created_at': last_transaction.created_at.isoformat()
            }
        
        return jsonify({
            'success': True,
            'data': {
                'total_spent_usd': round(total_spent, 2),
                'transaction_counts': status_summary,
                'recent_transactions_count': recent_transactions,
                'last_transaction': last_transaction_data
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch billing summary', 'message': str(e)}), 500


@billing_bp.route('/transaction/<int:transaction_id>', methods=['GET'])
@jwt_required()
def get_transaction_details():
    """Get specific transaction details"""
    try:
        user_id = get_jwt_identity()
        transaction_id = request.view_args['transaction_id']
        
        transaction = Transaction.query.filter_by(
            id=transaction_id, 
            user_id=user_id
        ).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        transaction_data = {
            'id': transaction.id,
            'plan': transaction.plan,
            'amount_usd': transaction.amount_usd,
            'status': transaction.status,
            'payment_method': transaction.payment_method,
            'created_at': transaction.created_at.isoformat(),
            'confirmed_at': transaction.confirmed_at.isoformat() if transaction.confirmed_at else None,
            'nowpayments_payment_id': transaction.nowpayments_payment_id,
            'pay_currency': transaction.pay_currency,
            'pay_amount': transaction.pay_amount,
            'pay_address': transaction.pay_address,
            'payment_url': transaction.payment_url,
            'order_id': transaction.order_id
        }
        
        return jsonify({
            'success': True,
            'data': transaction_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch transaction details', 'message': str(e)}), 500


@billing_bp.route('/pending-payments', methods=['GET'])
@jwt_required()
def get_pending_payments():
    """Get user's pending payments"""
    try:
        user_id = get_jwt_identity()
        
        pending_transactions = Transaction.query.filter_by(
            user_id=user_id,
            status='pending'
        ).order_by(desc(Transaction.created_at)).all()
        
        pending_list = []
        for txn in pending_transactions:
            # Check if payment is expired (older than 24 hours)
            is_expired = (datetime.now() - txn.created_at).total_seconds() > 86400
            
            transaction_data = {
                'id': txn.id,
                'plan': txn.plan,
                'amount_usd': txn.amount_usd,
                'pay_currency': txn.pay_currency,
                'pay_amount': txn.pay_amount,
                'pay_address': txn.pay_address,
                'payment_url': txn.payment_url,
                'order_id': txn.order_id,
                'created_at': txn.created_at.isoformat(),
                'is_expired': is_expired,
                'time_remaining': max(0, 86400 - (datetime.now() - txn.created_at).total_seconds()) if not is_expired else 0
            }
            pending_list.append(transaction_data)
        
        return jsonify({
            'success': True,
            'data': {
                'pending_payments': pending_list,
                'count': len(pending_list)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch pending payments', 'message': str(e)}), 500


@billing_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_billing_stats():
    """Get detailed billing statistics"""
    try:
        user_id = get_jwt_identity()
        
        # Monthly spending (last 12 months)
        twelve_months_ago = datetime.now() - timedelta(days=365)
        monthly_stats = db.session.query(
            func.date_trunc('month', Transaction.created_at).label('month'),
            func.sum(Transaction.amount_usd).label('total'),
            func.count(Transaction.id).label('count')
        ).filter(
            Transaction.user_id == user_id,
            Transaction.status == 'confirmed',
            Transaction.created_at >= twelve_months_ago
        ).group_by('month').order_by('month').all()
        
        monthly_data = []
        for stat in monthly_stats:
            monthly_data.append({
                'month': stat.month.strftime('%Y-%m'),
                'total_usd': float(stat.total),
                'transaction_count': stat.count
            })
        
        # Payment method breakdown
        payment_method_stats = db.session.query(
            Transaction.payment_method,
            func.count(Transaction.id).label('count'),
            func.sum(Transaction.amount_usd).label('total')
        ).filter(
            Transaction.user_id == user_id,
            Transaction.status == 'confirmed'
        ).group_by(Transaction.payment_method).all()
        
        payment_methods = []
        for stat in payment_method_stats:
            payment_methods.append({
                'method': stat.payment_method,
                'count': stat.count,
                'total_usd': float(stat.total)
            })
        
        return jsonify({
            'success': True,
            'data': {
                'monthly_spending': monthly_data,
                'payment_methods': payment_methods
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch billing stats', 'message': str(e)}), 500


# Error handlers for the blueprint
@billing_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@billing_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500