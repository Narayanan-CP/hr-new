import { Employee, Leave, Salary, Task } from '../types';

// Initialize mock data
export const initializeData = () => {
  // Initialize employees if not exists
  if (!localStorage.getItem('employees')) {
    const employees: Employee[] = [
      {
        id: 'emp-456',
        name: 'John Employee',
        email: 'john@example.com',
        password: 'password'
      }
    ];
    localStorage.setItem('employees', JSON.stringify(employees));
  }

  // Initialize leaves if not exists
  if (!localStorage.getItem('leaves')) {
    const leaves: Leave[] = [
      {
        id: 'leave-1',
        employeeId: 'emp-456',
        employeeName: 'John Employee',
        startDate: '2023-05-15',
        endDate: '2023-05-20',
        reason: 'Family vacation',
        status: 'approved',
        createdAt: '2023-05-01T10:30:00Z',
      },
      {
        id: 'leave-2',
        employeeId: 'emp-456',
        employeeName: 'John Employee',
        startDate: '2023-07-10',
        endDate: '2023-07-12',
        reason: 'Medical appointment',
        status: 'pending',
        createdAt: '2023-06-25T14:45:00Z',
      },
    ];
    localStorage.setItem('leaves', JSON.stringify(leaves));
  }

  // Initialize salaries if not exists
  if (!localStorage.getItem('salaries')) {
    const salaries: Salary[] = [
      {
        id: 'salary-1',
        employeeId: 'emp-456',
        employeeName: 'John Employee',
        amount: 5000,
        month: '04',
        year: '2023',
        status: 'paid',
        paymentDate: '2023-04-30',
      },
      {
        id: 'salary-2',
        employeeId: 'emp-456',
        employeeName: 'John Employee',
        amount: 5000,
        month: '05',
        year: '2023',
        status: 'paid',
        paymentDate: '2023-05-31',
      },
      {
        id: 'salary-3',
        employeeId: 'emp-456',
        employeeName: 'John Employee',
        amount: 5200,
        month: '06',
        year: '2023',
        status: 'pending',
      },
    ];
    localStorage.setItem('salaries', JSON.stringify(salaries));
  }

  // Initialize tasks if not exists
  if (!localStorage.getItem('tasks')) {
    const tasks: Task[] = [
      {
        id: 'task-1',
        title: 'Complete quarterly report',
        description: 'Compile and analyze Q2 sales data for management presentation',
        assignedTo: 'emp-456',
        deadline: '2023-07-15',
        status: 'in-progress',
      },
      {
        id: 'task-2',
        title: 'Update employee handbook',
        description: 'Review and update company policies in the employee handbook',
        assignedTo: 'emp-456',
        deadline: '2023-07-30',
        status: 'pending',
      },
    ];
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }
};

// Utility functions to interact with mock data
export const getLeaves = (): Leave[] => {
  const leavesData = localStorage.getItem('leaves');
  return leavesData ? JSON.parse(leavesData) : [];
};

export const getSalaries = (): Salary[] => {
  const salariesData = localStorage.getItem('salaries');
  return salariesData ? JSON.parse(salariesData) : [];
};

export const getTasks = (): Task[] => {
  const tasksData = localStorage.getItem('tasks');
  return tasksData ? JSON.parse(tasksData) : [];
};

export const addLeave = (leave: Omit<Leave, 'id' | 'status' | 'createdAt'>): Leave => {
  const leaves = getLeaves();
  const newLeave: Leave = {
    ...leave,
    id: `leave-${Date.now()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  localStorage.setItem('leaves', JSON.stringify([...leaves, newLeave]));
  return newLeave;
};

export const updateLeaveStatus = (leaveId: string, status: Leave['status']): boolean => {
  const leaves = getLeaves();
  const updatedLeaves = leaves.map(leave => 
    leave.id === leaveId ? { ...leave, status } : leave
  );
  
  localStorage.setItem('leaves', JSON.stringify(updatedLeaves));
  return true;
};
