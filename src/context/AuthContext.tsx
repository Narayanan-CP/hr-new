import { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, User, UserRole, Employee } from '../types';
import { initializeData } from '../utils/mockData';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<boolean>;
  getEmployees: () => Employee[];
  deleteEmployee: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Initialize mock data if it doesn't exist
    initializeData();
    
    // Check if user is already logged in
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          isAuthenticated: true,
        });
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Check if it's the HR login
    if (email === 'narayanan1812004@gmail.com' && password === '123456') {
      const hrUser: User = {
        id: 'hr-123',
        name: 'HR Manager',
        email,
        role: 'hr',
      };

      localStorage.setItem('currentUser', JSON.stringify(hrUser));
      setAuthState({
        user: hrUser,
        isAuthenticated: true,
      });
      
      return true;
    }

    // If not HR login, check if it's an employee login
    const employees = getEmployees();
    const employee = employees.find(emp => emp.email === email && emp.password === password);
    
    if (employee) {
      const employeeUser: User = {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: 'employee',
      };

      localStorage.setItem('currentUser', JSON.stringify(employeeUser));
      setAuthState({
        user: employeeUser,
        isAuthenticated: true,
      });
      
      return true;
    }
    
    return false;
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setAuthState({
      user: null,
      isAuthenticated: false,
    });
  };

  const getEmployees = (): Employee[] => {
    const storedEmployees = localStorage.getItem('employees');
    if (storedEmployees) {
      try {
        return JSON.parse(storedEmployees);
      } catch (error) {
        console.error('Failed to parse stored employees:', error);
        return [];
      }
    }
    return [];
  };

  const addEmployee = async (employeeData: Omit<Employee, 'id'>): Promise<boolean> => {
    try {
      const employees = getEmployees();
      
      // Check if email already exists
      if (employees.some(emp => emp.email === employeeData.email)) {
        return false;
      }
      
      const newEmployee: Employee = {
        ...employeeData,
        id: `emp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      };
      
      localStorage.setItem('employees', JSON.stringify([...employees, newEmployee]));
      
      // Initialize a salary record for the new employee
      const salaries = localStorage.getItem('salaries');
      if (salaries) {
        try {
          const parsedSalaries = JSON.parse(salaries);
          const currentDate = new Date();
          const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
          const currentYear = String(currentDate.getFullYear());
          
          // Add a new salary entry for this employee
          const newSalary = {
            id: `salary-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            employeeId: newEmployee.id,
            employeeName: newEmployee.name,
            amount: 5000, // Default starting salary
            month: currentMonth,
            year: currentYear,
            status: 'pending',
          };
          
          localStorage.setItem('salaries', JSON.stringify([...parsedSalaries, newSalary]));
        } catch (error) {
          console.error('Error updating salaries:', error);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error adding employee:', error);
      return false;
    }
  };

  const deleteEmployee = (id: string) => {
    const employees = getEmployees();
    const updatedEmployees = employees.filter(emp => emp.id !== id);
    localStorage.setItem('employees', JSON.stringify(updatedEmployees));
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        addEmployee,
        getEmployees,
        deleteEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
