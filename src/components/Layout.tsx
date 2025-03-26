import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Bell, CalendarDays, CircleAlert, ClipboardList, DollarSign, LayoutDashboard, LogOut, Menu, User, Users, X } from 'lucide-react';
import NotificationPanel from './NotificationPanel';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { getRelevantNotifications } = useNotifications();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const isHR = user?.role === 'hr';

  // Get notifications relevant to the current user
  const userNotifications = getRelevantNotifications(user?.id, user?.role);
  
  // Calculate unread notifications for specific types
  const unreadLeaveNotifications = userNotifications.filter(
    n => !n.read && n.type === 'leave'
  ).length;
  const unreadTaskNotifications = userNotifications.filter(
    n => !n.read && n.type === 'task'
  ).length;
  const unreadComplaintNotifications = userNotifications.filter(
    n => !n.read && n.type === 'complaint'
  ).length;

  // Define navigation items based on user role
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    ...(isHR ? [{ path: '/employees', label: 'Employees', icon: <Users size={20} /> }] : []),
    { 
      path: '/leaves', 
      label: 'Leave Management', 
      icon: <CalendarDays size={20} />,
      badge: unreadLeaveNotifications > 0 ? unreadLeaveNotifications : null
    },
    { path: '/salary', label: 'Salary', icon: <DollarSign size={20} /> },
    { 
      path: '/tasks', 
      label: 'Tasks', 
      icon: <ClipboardList size={20} />,
      badge: unreadTaskNotifications > 0 ? unreadTaskNotifications : null
    },
    { 
      path: '/complaints', 
      label: 'Complaints', 
      icon: <CircleAlert size={20} />,
      badge: unreadComplaintNotifications > 0 ? unreadComplaintNotifications : null
    },
  ];

  // Filter navigation items for employees if needed
  const userNavItems = navItems;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleNotifications = () => {
    setNotificationOpen(!notificationOpen);
  };

  const handleClickOutside = () => {
    if (notificationOpen) {
      setNotificationOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <aside 
        className={`fixed inset-y-0 z-10 flex flex-col flex-shrink-0 w-64 transition-all bg-white border-r md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <Link to="/" className="text-lg font-semibold text-blue-600">
            HR Harmony
          </Link>
          <button onClick={toggleSidebar} className="md:hidden">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-4 py-4 space-y-1">
            {userNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-2 text-sm rounded-md ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          
          {/* User profile section in sidebar for mobile */}
          <div className="px-4 py-4 mt-auto border-t border-gray-200 md:hidden">
            <div className="flex items-center">
              <div className={`p-2 rounded-full ${isHR ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                <User size={16} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">{isHR ? 'HR Admin' : 'Employee'}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="flex items-center w-full mt-4 px-4 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100"
            >
              <LogOut size={16} className="mr-2" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar} 
              className="p-1 mr-4 text-gray-500 rounded-md md:hidden hover:text-gray-900 hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">
              {location.pathname === '/' && 'Dashboard'}
              {location.pathname === '/employees' && 'Employee Management'}
              {location.pathname === '/leaves' && 'Leave Management'}
              {location.pathname === '/salary' && 'Salary Management'}
              {location.pathname === '/tasks' && 'Task Management'}
              {location.pathname === '/complaints' && 'Complaint Management'}
            </h1>
          </div>
          
          <div className="flex items-center">
            <div className="relative">
              <button 
                onClick={toggleNotifications}
                className="p-1 mr-4 text-gray-500 rounded-md hover:text-gray-900 hover:bg-gray-100 relative"
              >
                <Bell size={20} />
                {userNotifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                    {userNotifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              {notificationOpen && (
                <>
                  <div className="fixed inset-0 z-0" onClick={handleClickOutside}></div>
                  <NotificationPanel 
                    onClose={() => setNotificationOpen(false)} 
                    userRole={isHR ? 'hr' : 'employee'}
                  />
                </>
              )}
            </div>
            <div className="mr-4 text-sm text-gray-700">
              <div className="font-medium">{user?.name}</div>
              <div className={`text-xs ${isHR ? 'text-purple-600 font-semibold' : 'text-blue-600'}`}>
                {isHR ? 'HR Admin' : 'Employee'}
              </div>
            </div>
            <div className={`p-2 rounded-full ${isHR ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
              <User size={18} />
            </div>
            <button 
              onClick={logout} 
              className="p-1 ml-4 text-gray-500 rounded-md hover:text-gray-900 hover:bg-gray-100"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50" onClick={handleClickOutside}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
