import { useApp } from '../contexts/AppContext';
import { logAudit, requirePermission } from '../utils/enterpriseUtils';

export const useEmployees = () => {
  const { 
    currentUser, 
    masterData, 
    setMasterData, 
    auditLogs, 
    setAuditLogs 
  } = useApp();

  // Add employee
  const addEmployee = (employeeData) => {
    if (!requirePermission(currentUser, 'create', 'employee')) {
      logAudit(auditLogs, setAuditLogs, 'permission_denied', 'employee', null, null,
        { action: 'create' }, currentUser, false, 'Insufficient permissions');
      return { success: false, message: 'Insufficient permissions' };
    }

    const { empId, name, bankName, ifsc, accountNo } = employeeData;

    if (!empId || !name || !bankName || !ifsc || !accountNo) {
      return { success: false, message: 'Please fill in all required fields' };
    }

    if (!empId.startsWith('E')) {
      return { success: false, message: 'Emp ID must start with "E" (example: E0001)' };
    }

    if (masterData.employees[empId]) {
      return { success: false, message: `Employee ID ${empId} already exists!` };
    }

    const newEmployees = { ...masterData.employees };

    newEmployees[empId] = {
      ...employeeData,
      empId,
      ifsc: ifsc.toUpperCase(),
      type: 'employee',
      addedDate: new Date().toISOString(),
      source: 'manual_entry'
    };

    setMasterData({ ...masterData, employees: newEmployees });

    // Log audit
    logAudit(auditLogs, setAuditLogs, 'employee_created', 'employee', empId,
      null, newEmployees[empId], currentUser);

    return { success: true, employee: newEmployees[empId] };
  };

  // Update employee
  const updateEmployee = (empId, employeeData) => {
    if (!requirePermission(currentUser, 'edit', 'employee')) {
      logAudit(auditLogs, setAuditLogs, 'permission_denied', 'employee', empId, null,
        { action: 'edit' }, currentUser, false, 'Insufficient permissions');
      return { success: false, message: 'Insufficient permissions' };
    }

    const { name, bankName, ifsc, accountNo } = employeeData;

    if (!empId || !name || !bankName || !ifsc || !accountNo) {
      return { success: false, message: 'Please fill in all required fields' };
    }

    const oldEmployee = masterData.employees[empId];
    if (!oldEmployee) {
      return { success: false, message: 'Employee not found' };
    }

    const newEmployees = { ...masterData.employees };

    newEmployees[empId] = {
      ...oldEmployee,
      ...employeeData,
      empId, // Keep emp ID unchanged
      ifsc: ifsc.toUpperCase(),
      lastModified: new Date().toISOString(),
      modifiedBy: currentUser.username
    };

    setMasterData({ ...masterData, employees: newEmployees });

    // Log audit
    logAudit(auditLogs, setAuditLogs, 'employee_updated', 'employee', empId,
      oldEmployee, newEmployees[empId], currentUser);

    return { success: true, employee: newEmployees[empId] };
  };

  // Delete employee
  const deleteEmployee = (empId) => {
    if (!requirePermission(currentUser, 'delete', 'employee')) {
      logAudit(auditLogs, setAuditLogs, 'permission_denied', 'employee', empId, null,
        { action: 'delete' }, currentUser, false, 'Insufficient permissions');
      return { success: false, message: 'Insufficient permissions' };
    }

    const employee = masterData.employees[empId];
    if (!employee) {
      return { success: false, message: 'Employee not found' };
    }

    const newEmployees = { ...masterData.employees };
    delete newEmployees[empId];

    setMasterData({ ...masterData, employees: newEmployees });

    // Log audit
    logAudit(auditLogs, setAuditLogs, 'employee_deleted', 'employee', empId,
      employee, null, currentUser);

    return { success: true };
  };

  return {
    employees: masterData.employees,
    addEmployee,
    updateEmployee,
    deleteEmployee
  };
};
