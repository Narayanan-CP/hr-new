import { useState, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ShieldCheck, User, Users } from 'lucide-react';

type LoginTab = 'hr' | 'employee';

const Login = () => {
  const [activeTab, setActiveTab] = useState<LoginTab>('hr');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, user } = useAuth();

  // Redirect if already logged in
  if (isAuthenticated) {
    // If trying to log in as HR but logged in as employee, show error
    if (activeTab === 'hr' && user?.role === 'employee') {
      setError('Employees cannot access the HR portal. Please use the employee login.');
      return <Navigate to="/login" replace />;
    }
    
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      
      if (!success) {
        if (activeTab === 'hr') {
          setError('Invalid HR credentials. If you are an employee, please use the employee login tab.');
        } else {
          setError('Invalid employee credentials. Please check your email and password.');
        }
        console.error("Login failed with:", { email });
      } else {
        // Check if the role matches the intended login tab
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        if (activeTab === 'hr' && currentUser.role !== 'hr') {
          // Employee trying to log in as HR
          localStorage.removeItem('currentUser');
          setError('You do not have HR privileges. Please use the employee login tab.');
          setIsLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const switchTab = (tab: LoginTab) => {
    setActiveTab(tab);
    // Clear form fields when switching tabs
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">HR Harmony</h1>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-700">Sign in to your account</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Login Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              type="button"
              onClick={() => switchTab('hr')}
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'hr'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center">
                <ShieldCheck className="mr-2 h-5 w-5" />
                HR Login
              </div>
            </button>
            <button
              type="button"
              onClick={() => switchTab('employee')}
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'employee'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center">
                <User className="mr-2 h-5 w-5" />
                Employee Login
              </div>
            </button>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={activeTab === 'hr' ? "HR email address" : "Employee email address"}
                />
              </div>
              {activeTab === 'hr' && (
                <p className="mt-1 text-xs text-gray-500">
                  {/* HR login: narayanan1812004@gmail.com */}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {activeTab === 'hr' && (
                <p className="mt-1 text-xs text-gray-500">
                  {/* HR password: 123456 */}
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  activeTab === 'hr' 
                    ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500' 
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                } disabled:opacity-50`}
              >
                {isLoading ? 'Signing in...' : `Sign in as ${activeTab === 'hr' ? 'HR' : 'Employee'}`}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <div className="flex items-center justify-center">
              <Users className="h-5 w-5 text-gray-400 mr-2" />
              <p className="text-sm text-gray-500">
                {activeTab === 'hr' 
                  ? 'HR portal provides access to all management functions' 
                  : 'Employee portal provides access to your personal information and tasks'}
              </p>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-center text-xs text-gray-500">
              {activeTab === 'employee' && (
                <p>Employees must be registered by HR before they can log in</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
