import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Check, Clock, Pen, Play, Plus, User } from 'lucide-react';
import { Task, Employee } from '../types';

const TaskManagement = () => {
  const { user, getEmployees } = useAuth();
  const { addNotification } = useNotifications();
  const isHR = user?.role === 'hr';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    assignedTo: '',
  });
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    // Load tasks from localStorage
    const tasksData = localStorage.getItem('tasks');
    if (tasksData) {
      try {
        setTasks(JSON.parse(tasksData));
      } catch (error) {
        console.error('Failed to parse stored tasks:', error);
      }
    }
    
    // Load employees from auth context
    if (isHR) {
      setEmployees(getEmployees());
    }
  }, [isHR, getEmployees]);

  // Filter data for employees to only see their own records
  const filteredTasks = isHR ? tasks : tasks.filter(task => task.assignedTo === user?.id);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.assignedTo || !user) return;
    
    const assignedEmployee = employees.find(emp => emp.id === formData.assignedTo);
    if (!assignedEmployee) return;
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      assignedTo: formData.assignedTo,
      deadline: formData.deadline,
      status: 'pending',
    };
    
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    
    // Add notification for the assigned employee
    addNotification({
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${formData.title}`,
      type: 'task',
      relatedId: newTask.id,
      recipientId: formData.assignedTo, // This ensures only this employee sees it
      showToHR: false // Don't show to HR since we'll create a separate HR notification
    });
    
    // Add a separate notification for HR with the appropriate message
    addNotification({
      title: 'Task Assigned',
      message: `You have assigned a task to ${assignedEmployee.name}: ${formData.title}`,
      type: 'task',
      relatedId: newTask.id,
      recipientId: user.id, // This ensures only the HR who assigned it sees it
      showToHR: true // Make sure HR can see it
    });
    
    setFormData({ title: '', description: '', deadline: '', assignedTo: '' });
    setShowForm(false);
  };

  const updateTaskStatus = (taskId: string, newStatus: Task['status']) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const updatedTask = { ...task, status: newStatus };
        
        if (!isHR && user && newStatus === 'completed') {
          // When employee completes a task, only notify HR (not the employee themselves)
          const assignedEmployee = user.name; // Current employee name
          
          addNotification({
            title: 'Task Completed',
            message: `${assignedEmployee} has completed the assigned task: "${task.title}"`,
            type: 'task',
            relatedId: taskId,
            showToHR: true, // Only show to HR
            recipientId: undefined // Don't set a recipient ID so it won't show for any employee
          });
        } else if (isHR) {
          // When HR updates task status, notify the assigned employee
          addNotification({
            title: 'Task Status Updated by HR',
            message: `HR has updated the status of your task "${task.title}" to ${newStatus}.`,
            type: 'task',
            relatedId: taskId,
            recipientId: task.assignedTo, // Only the assigned employee should see this
            showToHR: false // Don't show to HR since they made the change
          });
        }
        
        return updatedTask;
      }
      return task;
    });
    
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check size={12} className="mr-1" />
            Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Play size={12} className="mr-1" />
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

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Task Management</h2>
          <p className="mt-1 text-sm text-gray-600">
            {isHR ? 'Assign and track employee tasks' : 'View and update your assigned tasks'}
          </p>
        </div>
        
        {isHR && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus size={16} className="mr-2" />
            Assign New Task
          </button>
        )}
      </div>
      
      {/* Task Assignment Form */}
      {showForm && isHR && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Assign New Task</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter task title"
                />
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  required
                  value={formData.description}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Describe the task in detail"
                />
              </div>
              
              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline
                </label>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  required
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To
                </label>
                <select
                  id="assignedTo"
                  name="assignedTo"
                  required
                  value={formData.assignedTo}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select Employee</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
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
                Assign Task
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Task List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">
            {isHR ? 'All Tasks' : 'Your Tasks'}
          </h3>
        </div>
        
        {filteredTasks.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredTasks.map((task) => (
              <li key={task.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {task.description}
                    </p>
                    <div className="mt-2 flex items-center">
                      {getStatusBadge(task.status)}
                      <span className="ml-2 text-xs text-gray-500">
                        Due: {new Date(task.deadline).toLocaleDateString()}
                      </span>
                      {isHR && (
                        <span className="ml-2 text-xs text-gray-500 flex items-center">
                          <User size={12} className="mr-1" />
                          {employees.find(emp => emp.id === task.assignedTo)?.name || 'Unknown Employee'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {!isHR && task.status !== 'completed' && (
                    <div className="ml-4 flex-shrink-0">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'in-progress')}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                        >
                          <Play size={14} className="mr-1" />
                          Start
                        </button>
                      )}
                      {task.status === 'in-progress' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                        >
                          <Check size={14} className="mr-1" />
                          Complete
                        </button>
                      )}
                    </div>
                  )}
                  
                  {isHR && (
                    <div className="ml-4 flex-shrink-0">
                      <button
                        onClick={() => {/* Pen functionality would go here */}}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Pen size={14} className="mr-1" />
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            No tasks found
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TaskManagement;
