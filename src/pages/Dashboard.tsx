import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getLeaves, getSalaries, getTasks } from '../utils/mockData';
import { CalendarDays, CircleAlert, CircleCheck, CircleX, ClipboardList, Clock, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const isHR = user?.role === 'hr';
  
  const leaves = getLeaves();
  const salaries = getSalaries();
  const tasks = getTasks();
  
  // Load complaints from localStorage
  let complaints: any[] = [];
  try {
    const storedComplaints = localStorage.getItem('complaints');
    if (storedComplaints) {
      complaints = JSON.parse(storedComplaints);
    }
  } catch (error) {
    console.error('Error loading complaints:', error);
  }
  
  // Filter data for employees to only see their own records
  const filteredLeaves = isHR ? leaves : leaves.filter(leave => leave.employeeId === user?.id);
  const filteredSalaries = isHR ? salaries : salaries.filter(salary => salary.employeeId === user?.id);
  const filteredTasks = isHR ? tasks : tasks.filter(task => task.assignedTo === user?.id);
  const filteredComplaints = isHR ? complaints : complaints.filter((complaint: any) => complaint.employeeId === user?.id);
  
  // Calculate stats
  const pendingLeaves = filteredLeaves.filter(leave => leave.status === 'pending').length;
  const approvedLeaves = filteredLeaves.filter(leave => leave.status === 'approved').length;
  const pendingSalaries = filteredSalaries.filter(salary => salary.status === 'pending').length;
  const pendingTasks = filteredTasks.filter(task => task.status === 'pending').length;
  const pendingComplaints = filteredComplaints.filter((complaint: any) => complaint.status === 'pending').length;
  
  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Welcome, {user?.name}!
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {isHR 
            ? 'Here\'s an overview of your organization\'s HR data.' 
            : 'Here\'s a summary of your personal information.'}
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/leaves" className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-50 text-blue-600">
              <CalendarDays size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Leave Requests</h3>
              <div className="flex items-center mt-1">
                <span className="text-2xl font-semibold">{filteredLeaves.length}</span>
                <span className="ml-2 text-sm text-gray-500">Total</span>
              </div>
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center text-sm">
              <Clock size={16} className="mr-1 text-yellow-500" />
              <span>{pendingLeaves} Pending</span>
            </div>
            <div className="flex items-center text-sm">
              <CircleCheck size={16} className="mr-1 text-green-500" />
              <span>{approvedLeaves} Approved</span>
            </div>
          </div>
        </Link>
        
        <Link to="/salary" className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-green-200 transition-colors">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-50 text-green-600">
              <DollarSign size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Salary Records</h3>
              <div className="flex items-center mt-1">
                <span className="text-2xl font-semibold">{filteredSalaries.length}</span>
                <span className="ml-2 text-sm text-gray-500">Total</span>
              </div>
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center text-sm">
              <Clock size={16} className="mr-1 text-yellow-500" />
              <span>{pendingSalaries} Pending</span>
            </div>
          </div>
        </Link>
        
        <Link to="/tasks" className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-purple-200 transition-colors">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-50 text-purple-600">
              <ClipboardList size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Tasks</h3>
              <div className="flex items-center mt-1">
                <span className="text-2xl font-semibold">{filteredTasks.length}</span>
                <span className="ml-2 text-sm text-gray-500">Total</span>
              </div>
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center text-sm">
              <Clock size={16} className="mr-1 text-yellow-500" />
              <span>{pendingTasks} Pending</span>
            </div>
          </div>
        </Link>
        
        <Link to="/complaints" className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-red-200 transition-colors">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-50 text-red-600">
              <CircleAlert size={24} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Complaints</h3>
              <div className="flex items-center mt-1">
                <span className="text-2xl font-semibold">{filteredComplaints.length}</span>
                <span className="ml-2 text-sm text-gray-500">Total</span>
              </div>
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center text-sm">
              <Clock size={16} className="mr-1 text-yellow-500" />
              <span>{pendingComplaints} Pending</span>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="mb-4 text-lg font-medium text-gray-800">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/leaves" className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-blue-300 transition-colors">
            <div className="flex items-center">
              <div className="p-2 mr-3 rounded-md bg-blue-50 text-blue-600">
                <CalendarDays size={20} />
              </div>
              <div>
                <h4 className="font-medium">{isHR ? 'Manage Leaves' : 'Apply for Leave'}</h4>
                <p className="text-sm text-gray-500">{isHR ? 'Review pending requests' : 'Submit a new leave request'}</p>
              </div>
            </div>
          </Link>
          
          <Link to="/salary" className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-green-300 transition-colors">
            <div className="flex items-center">
              <div className="p-2 mr-3 rounded-md bg-green-50 text-green-600">
                <DollarSign size={20} />
              </div>
              <div>
                <h4 className="font-medium">{isHR ? 'Manage Salaries' : 'View Salary'}</h4>
                <p className="text-sm text-gray-500">{isHR ? 'Process salary payments' : 'Check your salary history'}</p>
              </div>
            </div>
          </Link>
          
          <Link to="/tasks" className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-purple-300 transition-colors">
            <div className="flex items-center">
              <div className="p-2 mr-3 rounded-md bg-purple-50 text-purple-600">
                <ClipboardList size={20} />
              </div>
              <div>
                <h4 className="font-medium">{isHR ? 'Manage Tasks' : 'View Tasks'}</h4>
                <p className="text-sm text-gray-500">{isHR ? 'Assign tasks to employees' : 'Check your assigned tasks'}</p>
              </div>
            </div>
          </Link>
          
          <Link to="/complaints" className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-red-300 transition-colors">
            <div className="flex items-center">
              <div className="p-2 mr-3 rounded-md bg-red-50 text-red-600">
                <CircleAlert size={20} />
              </div>
              <div>
                <h4 className="font-medium">{isHR ? 'Manage Complaints' : 'Submit Complaint'}</h4>
                <p className="text-sm text-gray-500">{isHR ? 'Review and resolve issues' : 'Report workplace issues'}</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Recent Activity (placeholder) */}
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-800">Recent Activity</h3>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <p className="text-gray-500 text-center py-8">
            Recent activity will be displayed here.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
