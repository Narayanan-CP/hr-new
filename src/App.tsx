import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeeManagement from './pages/EmployeeManagement';
import LeaveManagement from './pages/LeaveManagement';
import SalaryManagement from './pages/SalaryManagement';
import TaskManagement from './pages/TaskManagement';
import ComplaintManagement from './pages/ComplaintManagement';
import ProtectedRoute from './components/ProtectedRoute';
import HRRoute from './components/HRRoute';
import './index.css';

function App() {
  useEffect(() => {
    // Load Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/employees" element={<HRRoute><EmployeeManagement /></HRRoute>} />
            <Route path="/leaves" element={<ProtectedRoute><LeaveManagement /></ProtectedRoute>} />
            <Route path="/salary" element={<ProtectedRoute><SalaryManagement /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><TaskManagement /></ProtectedRoute>} />
            <Route path="/complaints" element={<ProtectedRoute><ComplaintManagement /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
