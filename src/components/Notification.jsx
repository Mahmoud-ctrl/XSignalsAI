import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Settings } from 'lucide-react';
import Cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const POLLING_INTERVAL = 3 * 60 * 1000; // 3 minutes in milliseconds

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef(null);
  const pollingRef = useRef(null);

  const apiCall = async (endpoint, options = {}) => {
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': Cookies.get('csrf_access_token'),
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, defaultOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  };

  // Fetch notifications using the unified apiCall
  const fetchNotifications = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);

      const data = await apiCall(`/notifications/?page=${pageNum}&per_page=10`);

      if (reset || pageNum === 1) {
        setNotifications(data.notifications);
      } else {
        setNotifications((prev) => [...prev, ...data.notifications]);
      }

      setUnreadCount(data.unread_count);
      setHasMore(data.pagination.has_next);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      // Optionally show user-friendly error message
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count only (for polling) using unified apiCall
  const fetchUnreadCount = async () => {
    try {
      const data = await apiCall('/notifications/unread-count');

      // If unread count changed, refresh notifications
      if (data.unread_count !== unreadCount) {
        setUnreadCount(data.unread_count);
        if (isOpen) {
          fetchNotifications(1, true);
        }
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await apiCall(`/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, is_read: true }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await apiCall('/notifications/mark-all-read', {
        method: 'PUT',
      });
      
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await apiCall(`/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      const deletedNotif = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      if (deletedNotif && !deletedNotif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Load more notifications
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchNotifications(page + 1, false);
    }
  };

  // Format relative time
  const formatTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp * 1000);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Get notification icon based on content
  const getNotificationIcon = (message) => {
    if (message.includes('🔴') || message.includes('STOP LOSS')) {
      return '🔴';
    }
    if (message.includes('🎉') || message.includes('COMPLETED')) {
      return '🎉';
    }
    if (message.includes('🟢') || message.includes('Target')) {
      return '🟢';
    }
    return '📊';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Setup polling and initial fetch
  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();

    // Setup polling
    pollingRef.current = setInterval(fetchUnreadCount, POLLING_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications(1, true);
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon with Badge */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-300 hover:text-white transition-colors duration-200"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 max-h-96 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-white font-medium">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck size={16} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell size={48} className="mx-auto mb-4 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm mt-1">We'll notify you when something happens</p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-700 hover:bg-gray-750 transition-colors duration-200 group ${
                      !notification.is_read ? 'bg-gray-750/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Icon */}
                        <div className="text-lg mt-0.5 flex-shrink-0">
                          {getNotificationIcon(notification.message)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${notification.is_read ? 'text-gray-300' : 'text-white font-medium'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTime(notification.created_at_timestamp)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-gray-400 hover:text-green-400 transition-colors p-1"
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-400 hover:text-red-400 transition-colors p-1"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Load More Button */}
                {hasMore && (
                  <div className="p-4 border-b border-gray-700">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="w-full text-orange-500 hover:text-orange-400 text-sm transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : 'Load more notifications'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-700">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{notifications.length} notifications shown</span>
                <span>Updates every 3 min</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;