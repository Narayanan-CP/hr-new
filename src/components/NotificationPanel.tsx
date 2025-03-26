import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { Bell, CheckCheck } from 'lucide-react';

interface NotificationPanelProps {
  onClose: () => void;
  userRole?: 'hr' | 'employee';
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({  }) => {
  const { markAllAsRead, markAsRead, getRelevantNotifications } = useNotifications();
  const { user } = useAuth();
  
  // Get notifications relevant to the current user
  const relevantNotifications = getRelevantNotifications(user?.id, user?.role);
  
  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    // We could navigate to the related item here if needed
  };
  
  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-10 overflow-hidden border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
        {relevantNotifications.some(n => !n.read) && (
          <button 
            onClick={markAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
          >
            <CheckCheck size={14} className="mr-1" />
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {relevantNotifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {relevantNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <Bell size={16} className={`${!notification.read ? 'text-blue-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <p className={`text-sm ${!notification.read ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                      {notification.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            No notifications
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
