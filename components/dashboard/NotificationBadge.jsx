import { useState, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import Link from 'next/link';

export default function NotificationBadge({ notifications = [] }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-wine focus:outline-none focus:ring-2 focus:ring-wine focus:ring-offset-2 rounded-full"
      >
        <FiBell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-wine rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50">
          <div className="py-2">
            <div className="px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <div
                    key={index}
                    className={`px-4 py-3 hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <p className="text-sm text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No notifications
                </div>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200">
                <Link
                  href="/dashboard/agent/notifications"
                  className="text-sm text-wine hover:text-wine/90"
                >
                  View all notifications
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}