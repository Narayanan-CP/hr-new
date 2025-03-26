import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getSalaries } from '../utils/mockData';
import { CircleCheck, Clock, DollarSign, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Salary } from '../types';

// Add the autotable types to jsPDF
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface SalaryFormData {
  employeeId: string;
  amount: number;
}

const SalaryManagement = () => {
  const { user, getEmployees } = useAuth();
  const { addNotification } = useNotifications();
  const isHR = user?.role === 'hr';
  const [salaries, setSalaries] = useState(getSalaries());
  const [downloading, setDownloading] = useState(false);
  const [employees, setEmployees] = useState(getEmployees());
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingSalary, setEditingSalary] = useState<string | null>(null);
  const [formData, setFormData] = useState<SalaryFormData>({
    employeeId: '',
    amount: 0,
  });
  
  useEffect(() => {
    // Check for employees that don't have salary records for the current month
    const currentDate = new Date();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    const currentYear = String(currentDate.getFullYear());
    
    // Get all employees
    const allEmployees = getEmployees();
    setEmployees(allEmployees);
    
    // Refresh salaries
    const currentSalaries = getSalaries();
    setSalaries(currentSalaries);
    
    // Check for employees without salary records for current month
    const employeesWithSalaries = new Set(
      currentSalaries
        .filter(s => s.month === currentMonth && s.year === currentYear)
        .map(s => s.employeeId)
    );
    
    // Add salary records for employees without one
    let newSalaries = [...currentSalaries];
    let hasNewSalaries = false;
    
    allEmployees.forEach(employee => {
      if (!employeesWithSalaries.has(employee.id)) {
        // Create a new salary entry for this employee
        newSalaries.push({
          id: `salary-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          employeeId: employee.id,
          employeeName: employee.name,
          amount: 5000, // Default starting salary
          month: currentMonth,
          year: currentYear,
          status: 'pending',
        });
        hasNewSalaries = true;
      }
    });
    
    if (hasNewSalaries) {
      // Save the updated salaries
      localStorage.setItem('salaries', JSON.stringify(newSalaries));
      setSalaries(newSalaries);
    }
  }, []);
  
  // Filter data for employees to only see their own records
  const filteredSalaries = isHR ? salaries : salaries.filter(salary => salary.employeeId === user?.id);

  // Sort salaries by year and month (descending)
  const sortedSalaries = [...filteredSalaries].sort((a, b) => {
    if (a.year !== b.year) return Number(b.year) - Number(a.year);
    return Number(b.month) - Number(a.month);
  });

  const downloadSalarySlip = (salary: any) => {
    setDownloading(true);
    
    try {
      const doc = new jsPDF();
      const companyName = "HR Harmony"; 
      const date = new Date().toLocaleDateString();
      
      // Set font size and style for headings
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(companyName, 105, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.text('SALARY SLIP', 105, 30, { align: 'center' });
      
      // Add horizontal line
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);
      
      // Set font size and style for content
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      // Add employee details
      doc.text(`Employee Name: ${salary.employeeName}`, 20, 45);
      doc.text(`Employee ID: ${salary.employeeId}`, 20, 55);
      doc.text(`Pay Period: ${salary.month}/${salary.year}`, 20, 65);
      doc.text(`Payment Date: ${salary.paymentDate ? new Date(salary.paymentDate).toLocaleDateString() : 'Pending'}`, 20, 75);
      doc.text(`Status: ${salary.status.toUpperCase()}`, 20, 85);
      
      // Add salary details table
      const tableColumn = ["Description", "Amount ($)"];
      const tableRows = [
        ["Basic Salary", salary.amount.toFixed(2)],
        ["Allowances", (salary.amount * 0.1).toFixed(2)],
        ["Gross Salary", (salary.amount * 1.1).toFixed(2)],
        ["Tax Deduction", (salary.amount * 0.2).toFixed(2)],
        ["Net Salary", (salary.amount * 0.9).toFixed(2)]
      ];
      
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 95,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 135, 245] },
      });
      
      // Add footer
      doc.setFontSize(10);
      doc.text(`This is a computer-generated document. No signature is required.`, 105, 180, { align: 'center' });
      doc.text(`Generated on: ${date}`, 105, 185, { align: 'center' });
      
      // Save the PDF
      doc.save(`Salary_Slip_${salary.employeeName.replace(/\s+/g, '_')}_${salary.month}_${salary.year}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setDownloading(false);
    }
  };

  // Function to process salary (for HR)
  const processSalary = (salaryId: string, employeeId: string, employeeName: string, month: string, year: string) => {
    // Update the salary status in localStorage
    const updatedSalaries: Salary[] = salaries.map(salary => {
      if (salary.id === salaryId) {
        return {
          ...salary,
          status: "paid" as "paid",  // Explicitly cast status to match the type
          paymentDate: new Date().toISOString()
        };
      }
      return salary;
    });
    
    localStorage.setItem("salaries", JSON.stringify(updatedSalaries));
    setSalaries(updatedSalaries);
    
    // Notification for HR
    addNotification({
      title: 'Salary Processed',
      message: `You have successfully processed the salary for ${employeeName} for ${month}/${year}`,
      type: 'salary',
      relatedId: salaryId,
      showToHR: true,
      recipientId: user?.id // Only the HR who processed it should see this
    });
    
    // Notification for Employee
    addNotification({
      title: 'Salary Processed',
      message: `Your salary for ${month}/${year} has been processed`,
      type: 'salary',
      relatedId: salaryId,
      showToHR: false,
      recipientId: employeeId
    });
  };

  // Open the edit salary form
  const openEditSalary = (salary: any) => {
    setEditingSalary(salary.id);
    setFormData({
      employeeId: salary.employeeId,
      amount: salary.amount
    });
    setShowEditForm(true);
  };

  // Handle input change for the edit form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'amount' ? parseFloat(value) || 0 : value 
    }));
  };

  // Update salary
  const handleUpdateSalary = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingSalary) return;
    
    const updatedSalaries = salaries.map(salary => {
      if (salary.id === editingSalary) {
        const updatedSalary = { 
          ...salary, 
          amount: formData.amount
        };
        return updatedSalary;
      }
      return salary;
    });
    
    localStorage.setItem('salaries', JSON.stringify(updatedSalaries));
    setSalaries(updatedSalaries);
    
    const employee = employees.find(emp => emp.id === formData.employeeId);
    
    if (employee && user) {
      // Notification for HR
      addNotification({
        title: 'Salary Updated',
        message: `You have updated the salary details for ${employee.name}`,
        type: 'salary',
        showToHR: true,
        recipientId: user.id
      });
      
      // Notification for Employee
      addNotification({
        title: 'Salary Updated',
        message: 'Your salary has been updated. Please check your payroll details',
        type: 'salary',
        showToHR: false,
        recipientId: employee.id
      });
    }
    
    setShowEditForm(false);
    setEditingSalary(null);
  };

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Salary Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          {isHR ? 'Manage employee salaries' : 'View your salary history'}
        </p>
      </div>
      
      {/* Salary Edit Modal */}
      {showEditForm && isHR && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Update Salary</h3>
              <button onClick={() => setShowEditForm(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateSalary}>
              <div className="mb-4">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Salary Amount ($)
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  min="0"
                  step="100"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Update Salary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Salary Summary Card */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center mb-6">
          <div className="p-3 rounded-full bg-green-50 text-green-600">
            <DollarSign size={24} />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-800">
              {isHR ? 'Salary Overview' : 'Your Salary Information'}
            </h3>
          </div>
        </div>
        
        {isHR ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-500">Total Employees</div>
              <div className="mt-1 text-2xl font-semibold">{employees.length}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-500">This Month's Payroll</div>
              <div className="mt-1 text-2xl font-semibold">
                ${salaries
                  .filter(s => {
                    const currentDate = new Date();
                    return s.month === String(currentDate.getMonth() + 1).padStart(2, '0') && 
                           s.year === String(currentDate.getFullYear());
                  })
                  .reduce((sum, s) => sum + s.amount, 0)
                  .toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-500">Pending Payments</div>
              <div className="mt-1 text-2xl font-semibold">
                {salaries.filter(s => s.status === 'pending').length}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-500">Latest Salary</div>
              <div className="mt-1 text-2xl font-semibold">
                ${sortedSalaries[0]?.amount.toLocaleString()}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                {sortedSalaries[0]?.month}/{sortedSalaries[0]?.year}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-500">Year-to-Date</div>
              <div className="mt-1 text-2xl font-semibold">
                ${sortedSalaries.reduce((sum, salary) => {
                  return sum + (salary.status === 'paid' ? salary.amount : 0);
                }, 0).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Salary History Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">
            {isHR ? 'Employee Salary Records' : 'Your Salary History'}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {isHR && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSalaries.length > 0 ? (
                sortedSalaries.map((salary) => (
                  <tr key={salary.id}>
                    {isHR && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salary.employeeName}</td>}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {`${salary.month}/${salary.year}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${salary.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {salary.status === 'paid' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CircleCheck size={12} className="mr-1" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock size={12} className="mr-1" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {salary.paymentDate 
                        ? new Date(salary.paymentDate).toLocaleDateString() 
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {salary.status === 'paid' ? (
                        <button 
                          className="inline-flex items-center text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          onClick={() => downloadSalarySlip(salary)}
                          disabled={downloading}
                        >
                          {/* <Download size={16} className="mr-1" /> */}
                          {/* <span>{downloading ? 'Generating...' : 'Download Slip'}</span> */}
                        </button>
                      ) : (
                        isHR && (
                          <button 
                            className="inline-flex items-center text-green-600 hover:text-green-900"
                            onClick={() => processSalary(
                              salary.id, 
                              salary.employeeId, 
                              salary.employeeName, 
                              salary.month, 
                              salary.year
                            )}
                          >
                            <CircleCheck size={16} className="mr-1" />
                            <span>Process</span>
                          </button>
                        )
                      )}
                      
                      {isHR && (
                        <button 
                          className="inline-flex items-center text-purple-600 hover:text-purple-900 ml-3"
                          onClick={() => openEditSalary(salary)}
                        >
                          <DollarSign size={16} className="mr-1" />
                          <span>Edit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isHR ? 6 : 5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No salary records found
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

export default SalaryManagement;
