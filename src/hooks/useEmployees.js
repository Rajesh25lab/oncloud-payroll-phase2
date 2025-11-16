import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useAudit } from '../contexts/AuditContext';
import { requirePermission } from '../utils/enterpriseUtils';

export const useEmployees = () => {
  const { currentUser } = useAuth();
  const { employees, dispatch: dataDispatch } = useData();
  const { logAudit } = useAudit();

  // Add employee
  const addEmployee = (employeeData) => {
    if (!requirePermission(currentUser, 'create', 'employee')) {
      logAudit({
        action: 'permission_denied',
        resource: 'employee',
        resourceId: null,
        performedBy: currentUser?.username || 'unknown',
        performedByName: currentUser?.name || 'Unknown',
        metadata: { action: 'create' },
        success: false,
        errorMessage: 'Insufficient permissions'
      });
      return { success: false, message: 'Insufficient permissions' };
    }

    const { empId, name, bankName, ifsc, accountNo } = employeeData;

    if (!empId || !name || !bankName || !ifsc || !accountNo) {
      return { success: false, message: 'Please fill in all required fields' };
    }

    if (!empId.startsWith('E')) {
      return { success: false, message: 'Emp ID must start with "E" (example: E0001)' };
    }

    if (employees[empId]) {
      return { success: false, message: `Employee ID ${empId} already exists!` };
    }

    const newEmployee = {
      ...employeeData,
      empId,
      ifsc: ifsc.toUpperCase(),
      type: 'employee',
      addedDate: new Date().toISOString(),
      source: 'manual_entry'
    };

    dataDispatch({ type: 'ADD_EMPLOYEE', payload: newEmployee });

    // Log audit
    logAudit({
      action: 'employee_created',
      resource: 'employee',
      resourceId: empId,
      performedBy: currentUser.username,
      performedByName: currentUser.name,
      metadata: newEmployee,
      success: true
    });

    return { success: true, employee: newEmployee };
  };

  // Update employee
  const updateEmployee = (empId, employeeData) => {
    if (!requirePermission(currentUser, 'edit', 'employee')) {
      logAudit({
        action: 'permission_denied',
        resource: 'employee',
        resourceId: empId,
        performedBy: currentUser?.username || 'unknown',
        performedByName: currentUser?.name || 'Unknown',
        metadata: { action: 'edit' },
        success: false,
        errorMessage: 'Insufficient permissions'
      });
      return { success: false, message: 'Insufficient permissions' };
    }

    const { name, bankName, ifsc, accountNo } = employeeData;

    if (!empId || !name || !bankName || !ifsc || !accountNo) {
      return { success: false, message: 'Please fill in all required fields' };
    }

    const oldEmployee = employees[empId];
    if (!oldEmployee) {
      return { success: false, message: 'Employee not found' };
    }

    const updatedEmployee = {
      ...oldEmployee,
      ...employeeData,
      empId, // Keep emp ID unchanged
      ifsc: ifsc.toUpperCase(),
      lastModified: new Date().toISOString(),
      modifiedBy: currentUser.username
    };

    dataDispatch({ type: 'UPDATE_EMPLOYEE', payload: updatedEmployee });

    // Log audit
    logAudit({
      action: 'employee_updated',
      resource: 'employee',
      resourceId: empId,
      performedBy: currentUser.username,
      performedByName: currentUser.name,
      metadata: { old: oldEmployee, new: updatedEmployee },
      success: true
    });

    return { success: true, employee: updatedEmployee };
  };

  // Delete employee
  const deleteEmployee = (empId) => {
    if (!requirePermission(currentUser, 'delete', 'employee')) {
      logAudit({
        action: 'permission_denied',
        resource: 'employee',
        resourceId: empId,
        performedBy: currentUser?.username || 'unknown',
        performedByName: currentUser?.name || 'Unknown',
        metadata: { action: 'delete' },
        success: false,
        errorMessage: 'Insufficient permissions'
      });
      return { success: false, message: 'Insufficient permissions' };
    }

    const employee = employees[empId];
    if (!employee) {
      return { success: false, message: 'Employee not found' };
    }

    dataDispatch({ type: 'DELETE_EMPLOYEE', payload: empId });

    // Log audit
    logAudit({
      action: 'employee_deleted',
      resource: 'employee',
      resourceId: empId,
      performedBy: currentUser.username,
      performedByName: currentUser.name,
      metadata: employee,
      success: true
    });

    return { success: true };
  };

  return {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee
  };
};
