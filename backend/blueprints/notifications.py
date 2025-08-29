# notifications.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Notification, User
from datetime import datetime
import pytz

lebanon_tz = pytz.timezone("Asia/Beirut")

# Create notifications blueprint WITHOUT url_prefix (it's handled in app.py)
notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/notifications/', methods=['GET'])
@jwt_required()
def get_user_notifications():
    """Get all notifications for the authenticated user"""
    try:
        # Get user ID from JWT token
        user_id = get_jwt_identity()
        
        # Validate user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Limit per_page to prevent abuse
        if per_page > 100:
            per_page = 100
        
        # Get filter parameters
        is_read = request.args.get('is_read')  # Optional filter: 'true', 'false', or None for all
        
        # Build query
        query = Notification.query.filter_by(user_id=user_id)
        
        # Apply read/unread filter if specified
        if is_read is not None:
            if is_read.lower() == 'true':
                query = query.filter_by(is_read=True)
            elif is_read.lower() == 'false':
                query = query.filter_by(is_read=False)
        
        # Order by creation date (newest first) and paginate
        notifications = query.order_by(Notification.created_at.desc()).paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        # Format notifications data
        notifications_data = []
        for notification in notifications.items:
            notifications_data.append({
                'id': notification.id,
                'message': notification.message,
                'is_read': notification.is_read,
                'created_at': notification.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'created_at_timestamp': int(notification.created_at.timestamp())
            })
        
        # Get unread count
        unread_count = Notification.query.filter_by(
            user_id=user_id, 
            is_read=False
        ).count()
        
        return jsonify({
            'success': True,
            'notifications': notifications_data,
            'pagination': {
                'page': notifications.page,
                'per_page': notifications.per_page,
                'total': notifications.total,
                'pages': notifications.pages,
                'has_next': notifications.has_next,
                'has_prev': notifications.has_prev
            },
            'unread_count': unread_count
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch notifications: {str(e)}'}), 500

@notifications_bp.route('/notifications/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get count of unread notifications for the authenticated user"""
    try:
        user_id = get_jwt_identity()
        
        unread_count = Notification.query.filter_by(
            user_id=user_id, 
            is_read=False
        ).count()
        
        return jsonify({
            'success': True,
            'unread_count': unread_count
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get unread count: {str(e)}'}), 500

@notifications_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark a specific notification as read"""
    try:
        user_id = get_jwt_identity()
        
        # Find the notification and ensure it belongs to the user
        notification = Notification.query.filter_by(
            id=notification_id, 
            user_id=user_id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        # Mark as read if not already read
        if not notification.is_read:
            notification.is_read = True
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Notification marked as read',
            'notification': {
                'id': notification.id,
                'message': notification.message,
                'is_read': notification.is_read,
                'created_at': notification.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to mark notification as read: {str(e)}'}), 500

@notifications_bp.route('/notifications/mark-all-read', methods=['PUT'])
@jwt_required()
def mark_all_notifications_read():
    """Mark all notifications as read for the authenticated user"""
    try:
        user_id = get_jwt_identity()
        
        # Update all unread notifications for the user
        updated_count = Notification.query.filter_by(
            user_id=user_id, 
            is_read=False
        ).update({'is_read': True})
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Marked {updated_count} notifications as read',
            'updated_count': updated_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to mark all notifications as read: {str(e)}'}), 500

@notifications_bp.route('/notifications/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a specific notification"""
    try:
        user_id = get_jwt_identity()
        
        # Find the notification and ensure it belongs to the user
        notification = Notification.query.filter_by(
            id=notification_id, 
            user_id=user_id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Notification deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete notification: {str(e)}'}), 500

@notifications_bp.route('/notifications/clear-all', methods=['DELETE'])
@jwt_required()
def clear_all_notifications():
    """Delete all notifications for the authenticated user"""
    try:
        user_id = get_jwt_identity()
        
        # Delete all notifications for the user
        deleted_count = Notification.query.filter_by(user_id=user_id).delete()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Cleared {deleted_count} notifications',
            'deleted_count': deleted_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to clear notifications: {str(e)}'}), 500

@notifications_bp.route('/notifications/recent', methods=['GET'])
@jwt_required()
def get_recent_notifications():
    """Get the most recent notifications (last 10) for quick access"""
    try:
        user_id = get_jwt_identity()
        
        # Get last 10 notifications
        recent_notifications = Notification.query.filter_by(
            user_id=user_id
        ).order_by(Notification.created_at.desc()).limit(10).all()
        
        notifications_data = []
        for notification in recent_notifications:
            notifications_data.append({
                'id': notification.id,
                'message': notification.message,
                'is_read': notification.is_read,
                'created_at': notification.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'created_at_timestamp': int(notification.created_at.timestamp())
            })
        
        return jsonify({
            'success': True,
            'notifications': notifications_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch recent notifications: {str(e)}'}), 500

# Error handlers for the blueprint
@notifications_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@notifications_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized access'}), 401

@notifications_bp.errorhandler(403)
def forbidden(error):
    return jsonify({'error': 'Forbidden'}), 403

@notifications_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@notifications_bp.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500