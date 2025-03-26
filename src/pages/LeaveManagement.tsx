import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getLeaves, addLeave, updateLeaveStatus } from '../utils/mockData';
import { Leave } from '../types';
import { CircleAlert, CircleCheck, CircleX, Plus } from 'lucide-react';

const LeaveManagement = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const isHR = user?.role === 'hr';
  const [leaves, setLeaves] = useState<Leave[]>(getLeaves());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Refresh leaves when the component mounts
  useEffect(() => {
    setLeaves(getLeaves());
  }, []);

  const filteredLeaves = isHR 
    ? leaves 
    : leaves.filter(leave => leave.employeeId === user?.id);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    const newLeave = addLeave({
      employeeId: user.id,
      employeeName: user.name,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
    });
    
    setLeaves(prev => [...prev, newLeave]);
    
    // Add notification for HR
    addNotification({
      title: 'New Leave Request',
      message: `${user.name} has applied for leave from ${formData.startDate} to ${formData.endDate}`,
      type: 'leave',
      relatedId: newLeave.id,
      showToHR: true,
      recipientId: undefined // This ensures all HR managers can see it
    });
    
    // Add notification for the employee
    addNotification({
      title: 'Leave Request Submitted',
      message: 'Your leave request has been submitted for approval',
      type: 'leave',
      relatedId: newLeave.id,
      showToHR: false,
      recipientId: user.id // Only this employee should see this notification
    });
    
    setFormData({ startDate: '', endDate: '', reason: '' });
    setShowForm(false);
  };

  const handleStatusChange = (leaveId: string, status: Leave['status'], employeeId: string, _employeeName: string, startDate: string, endDate: string) => {
    updateLeaveStatus(leaveId, status);
    setLeaves(prev => 
      prev.map(leave => 
        leave.id === leaveId ? { ...leave, status } : leave
      )
    );
    
    // Add notification only for the employee
    addNotification({
      title: `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your leave request from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()} has been ${status === 'approved' ? 'approved' : 'rejected'}`,
      type: 'leave',
      relatedId: leaveId,
      showToHR: false,
      recipientId: employeeId // Only send to the specific employee
    });
  };

  const getStatusBadge = (status: Leave['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CircleCheck size={12} className="mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <CircleX size={12} className="mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <CircleAlert size={12} className="mr-1" />
            Pending
          </span>
        );
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Leave Management</h2>
          <p className="mt-1 text-sm text-gray-600">
            {isHR ? 'Manage employee leave requests' : 'View and request leaves'}
          </p>
        </div>
        
        {!isHR && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus size={16} className="mr-2" />
            Apply for Leave
          </button>
        )}
      </div>
      
      {/* Leave Application Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Apply for Leave</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  required
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  required
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={3}
                  required
                  value={formData.reason}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Please provide a reason for your leave request"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Leave List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">
            {isHR ? 'All Leave Requests' : 'Your Leave History'}
          </h3>
          {isHR && (
            <div className="mt-1 text-sm text-gray-500">
              <span className="text-yellow-600 font-medium">
                {leaves.filter(leave => leave.status === 'pending').length}
              </span> pending requests
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {isHR && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {isHR && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeaves.length > 0 ? (
                filteredLeaves.map((leave) => (
                  <tr key={leave.id} className={leave.status === 'pending' && isHR ? 'bg-yellow-50' : ''}>
                    {isHR && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{leave.employeeName}</td>}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{leave.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(leave.status)}
                    </td>
                    {isHR && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {leave.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleStatusChange(
                                leave.id, 
                                'approved', 
                                leave.employeeId, 
                                leave.employeeName,
                                leave.startDate,
                                leave.endDate
                              )}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CircleCheck size={18} />
                            </button>
                            <button
                              onClick={() => handleStatusChange(
                                leave.id, 
                                'rejected', 
                                leave.employeeId, 
                                leave.employeeName,
                                leave.startDate,
                                leave.endDate
                              )}
                              className="text-red-600 hover:text-red-900"
                            >
                              <CircleX size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isHR ? 5 : 4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No leave requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default LeaveManagement;
