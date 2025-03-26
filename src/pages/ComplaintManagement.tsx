import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { CircleAlert, CircleCheck, Clock, MessageCircle } from 'lucide-react';

interface Complaint {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'in-progress' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  response?: string;
}

const ComplaintManagement = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const isHR = user?.role === 'hr';
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'work-environment',
  });
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    // Load complaints from localStorage
    const storedComplaints = localStorage.getItem('complaints');
    if (storedComplaints) {
      try {
        setComplaints(JSON.parse(storedComplaints));
      } catch (error) {
        console.error('Failed to parse stored complaints:', error);
      }
    }
  }, []);

  // Filter complaints for employees to only see their own
  const filteredComplaints = isHR 
    ? complaints 
    : complaints.filter(complaint => complaint.employeeId === user?.id);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    const newComplaint: Complaint = {
      id: `complaint-${Date.now()}`,
      employeeId: user.id,
      employeeName: user.name,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    const updatedComplaints = [...complaints, newComplaint];
    setComplaints(updatedComplaints);
    localStorage.setItem('complaints', JSON.stringify(updatedComplaints));
    
    // Add notification for HR
    addNotification({
      title: 'New Complaint Filed',
      message: `${user.name} has submitted a new complaint: ${formData.title}`,
      type: 'complaint',
      relatedId: newComplaint.id,
      showToHR: true,
      recipientId: undefined // Ensure all HR can see it
    });
    
    // Add notification for the employee
    addNotification({
      title: 'Complaint Submitted',
      message: 'Your complaint has been submitted successfully',
      type: 'complaint',
      relatedId: newComplaint.id,
      showToHR: false,
      recipientId: user.id // Only this employee should see it
    });
    
    setFormData({ title: '', description: '', category: 'work-environment' });
    setShowForm(false);
  };

  const updateComplaintStatus = (complaintId: string, status: 'pending' | 'in-progress' | 'resolved', response?: string) => {
    const complaintToUpdate = complaints.find(c => c.id === complaintId);
    if (!complaintToUpdate || !user) return;
    
    const updatedComplaints = complaints.map(complaint => {
      if (complaint.id === complaintId) {
        const updatedComplaint: Complaint = { 
          ...complaint, 
          status,
          ...(status === 'resolved' ? { resolvedAt: new Date().toISOString() } : {}),
          ...(response ? { response } : {})
        };
        
        if (status === 'resolved') {
          // Add notification for HR
          addNotification({
            title: 'Complaint Resolved',
            message: `You have resolved the complaint: ${complaint.title} submitted by ${complaint.employeeName}`,
            type: 'complaint',
            relatedId: complaintId,
            showToHR: true,
            recipientId: user.id // Only the HR who resolved it should see this
          });
          
          // Add notification for the employee
          addNotification({
            title: 'Complaint Resolved',
            message: `Your complaint ${complaint.title} has been resolved`,
            type: 'complaint',
            relatedId: complaintId,
            showToHR: false,
            recipientId: complaint.employeeId
          });
        } else {
          // Add notification only for the employee when status changes to in-progress
          addNotification({
            title: 'Complaint Status Updated',
            message: `Your complaint ${complaint.title} status has been updated to ${status.replace('-', ' ')}`,
            type: 'complaint',
            relatedId: complaintId,
            showToHR: false,
            recipientId: complaint.employeeId
          });
        }
        
        return updatedComplaint;
      }
      return complaint;
    });
    
    setComplaints(updatedComplaints);
    localStorage.setItem('complaints', JSON.stringify(updatedComplaints));
    setShowResponseForm(null);
    setResponseText('');
  };

  const handleResponse = (complaintId: string) => {
    if (!responseText.trim()) return;
    updateComplaintStatus(complaintId, 'resolved', responseText);
  };

  const getStatusBadge = (status: Complaint['status']) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CircleCheck size={12} className="mr-1" />
            Resolved
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <MessageCircle size={12} className="mr-1" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock size={12} className="mr-1" />
            Pending
          </span>
        );
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'work-environment': return 'Work Environment';
      case 'harassment': return 'Harassment';
      case 'discrimination': return 'Discrimination';
      case 'compensation': return 'Compensation';
      case 'management': return 'Management';
      default: return 'Other';
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Complaint Management</h2>
          <p className="mt-1 text-sm text-gray-600">
            {isHR ? 'Review and respond to employee complaints' : 'Submit and track your complaints'}
          </p>
        </div>
        
        {!isHR && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <CircleAlert size={16} className="mr-2" />
            Submit Complaint
          </button>
        )}
      </div>
      
      {/* Complaint Submission Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Submit a Complaint</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Brief title of your complaint"
                />
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="work-environment">Work Environment</option>
                  <option value="harassment">Harassment</option>
                  <option value="discrimination">Discrimination</option>
                  <option value="compensation">Compensation</option>
                  <option value="management">Management</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  required
                  value={formData.description}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Please provide details about your complaint"
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
      
      {/* Complaints List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">
            {isHR ? 'All Complaints' : 'Your Complaints'}
          </h3>
        </div>
        
        {filteredComplaints.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredComplaints.map((complaint) => (
              <div key={complaint.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{complaint.title}</h4>
                    <div className="mt-1 flex items-center space-x-2">
                      {getStatusBadge(complaint.status)}
                      <span className="text-sm text-gray-500">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {getCategoryLabel(complaint.category)}
                      </span>
                    </div>
                  </div>
                  {isHR && complaint.status !== 'resolved' && (
                    <div className="flex space-x-2">
                      {complaint.status === 'pending' && (
                        <button
                          onClick={() => updateComplaintStatus(complaint.id, 'in-progress')}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                        >
                          Mark In Progress
                        </button>
                      )}
                      <button
                        onClick={() => setShowResponseForm(complaint.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
                
                <p className="mt-3 text-sm text-gray-600">{complaint.description}</p>
                
                {complaint.response && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-md">
                    <h5 className="text-sm font-medium text-gray-700">HR Response:</h5>
                    <p className="mt-1 text-sm text-gray-600">{complaint.response}</p>
                    {complaint.resolvedAt && (
                      <p className="mt-2 text-xs text-gray-400">
                        Resolved on {new Date(complaint.resolvedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
                
                {showResponseForm === complaint.id && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Respond to Complaint</h5>
                    <textarea
                      rows={3}
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter your response..."
                    />
                    <div className="mt-3 flex justify-end space-x-2">
                      <button
                        onClick={() => setShowResponseForm(null)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleResponse(complaint.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-white bg-green-600 hover:bg-green-700"
                      >
                        Submit & Resolve
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <CircleAlert className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No complaints found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isHR ? 'There are no complaints to review at this time.' : 'You haven\'t submitted any complaints yet.'}
            </p>
            {!isHR && (
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <CircleAlert size={16} className="mr-2" />
                  Submit Complaint
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ComplaintManagement;
