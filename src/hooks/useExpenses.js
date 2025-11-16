import { useApp } from '../contexts/AppContext';
import { logAudit, requirePermission } from '../utils/enterpriseUtils';
import { generateId } from '../utils/exportUtils';

export const useExpenses = () => {
  const { 
    currentUser, 
    expenses, 
    setExpenses, 
    auditLogs, 
    setAuditLogs 
  } = useApp();

  // Add expense
  const addExpense = (expenseData) => {
    if (!requirePermission(currentUser, 'create', 'expense')) {
      logAudit(auditLogs, setAuditLogs, 'permission_denied', 'expense', null, null, 
        { action: 'create' }, currentUser, false, 'Insufficient permissions');
      return { success: false, message: 'Insufficient permissions' };
    }

    const expenseId = generateId('EXP');
    const newExpense = {
      id: expenseId,
      ...expenseData,
      status: 'pending',
      submittedBy: currentUser.username,
      submittedByName: currentUser.name,
      submittedDate: new Date().toISOString()
    };

    setExpenses([...expenses, newExpense]);

    // Log audit
    logAudit(auditLogs, setAuditLogs, 'expense_created', 'expense', expenseId, 
      null, newExpense, currentUser);

    return { success: true, expense: newExpense };
  };

  // Approve expense
  const approveExpense = (expenseId) => {
    if (!requirePermission(currentUser, 'approve', 'expense')) {
      logAudit(auditLogs, setAuditLogs, 'permission_denied', 'expense', expenseId, 
        null, { action: 'approve' }, currentUser, false, 'Insufficient permissions');
      return { success: false, message: 'Insufficient permissions' };
    }

    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) {
      return { success: false, message: 'Expense not found' };
    }

    const updatedExpense = {
      ...expense,
      status: 'approved',
      approvedBy: currentUser.username,
      approvedByName: currentUser.name,
      approvedDate: new Date().toISOString()
    };

    setExpenses(expenses.map(e => e.id === expenseId ? updatedExpense : e));

    // Log audit
    logAudit(auditLogs, setAuditLogs, 'expense_approved', 'expense', expenseId, 
      expense, updatedExpense, currentUser);

    return { success: true, expense: updatedExpense };
  };

  // Reject expense
  const rejectExpense = (expenseId) => {
    if (!requirePermission(currentUser, 'approve', 'expense')) {
      logAudit(auditLogs, setAuditLogs, 'permission_denied', 'expense', expenseId, 
        null, { action: 'reject' }, currentUser, false, 'Insufficient permissions');
      return { success: false, message: 'Insufficient permissions' };
    }

    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) {
      return { success: false, message: 'Expense not found' };
    }

    const updatedExpense = {
      ...expense,
      status: 'rejected',
      rejectedBy: currentUser.username,
      rejectedByName: currentUser.name,
      rejectedDate: new Date().toISOString()
    };

    setExpenses(expenses.map(e => e.id === expenseId ? updatedExpense : e));

    // Log audit
    logAudit(auditLogs, setAuditLogs, 'expense_rejected', 'expense', expenseId, 
      expense, updatedExpense, currentUser);

    return { success: true, expense: updatedExpense };
  };

  // Delete expense
  const deleteExpense = (expenseId) => {
    if (!requirePermission(currentUser, 'delete', 'expense')) {
      logAudit(auditLogs, setAuditLogs, 'permission_denied', 'expense', expenseId, 
        null, { action: 'delete' }, currentUser, false, 'Insufficient permissions');
      return { success: false, message: 'Insufficient permissions' };
    }

    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) {
      return { success: false, message: 'Expense not found' };
    }

    setExpenses(expenses.filter(e => e.id !== expenseId));

    // Log audit
    logAudit(auditLogs, setAuditLogs, 'expense_deleted', 'expense', expenseId, 
      expense, null, currentUser);

    return { success: true };
  };

  // Get filtered expenses
  const pendingExpenses = expenses.filter(e => e.status === 'pending');
  const approvedExpenses = expenses.filter(e => e.status === 'approved');
  const rejectedExpenses = expenses.filter(e => e.status === 'rejected');

  return {
    expenses,
    pendingExpenses,
    approvedExpenses,
    rejectedExpenses,
    addExpense,
    approveExpense,
    rejectExpense,
    deleteExpense
  };
};
