import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HRRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== 'hr') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default HRRoute;
