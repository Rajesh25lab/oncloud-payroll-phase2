import { useAuth } from '../contexts/AuthContext';
import { useExpenseContext } from '../contexts/ExpenseContext';
import { useAudit } from '../contexts/AuditContext';
import { requirePermission } from '../utils/enterpriseUtils';
import { generateId } from '../utils/exportUtils';

export const useExpenses = () => {
  const { currentUser } = useAuth();
  const { 
    expenses,
    pendingExpenses, 
    approvedExpenses, 
    rejectedExpenses,
    dispatch: expenseDispatch 
  } = useExpenseContext();
  const { logAudit } = useAudit();

  // Add expense
  const addExpense = (expenseData) => {
    if (!requirePermission(currentUser, 'create', 'expense')) {
      logAudit({
        action: 'permission_denied',
        resource: 'expense',
        resourceId: null,
        performedBy: currentUser?.username || 'unknown',
        performedByName: currentUser?.name || 'Unknown',
        metadata: { action: 'create' },
        success: false,
        errorMessage: 'Insufficient permissions'
      });
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

    expenseDispatch({ type: 'ADD_EXPENSE', payload: newExpense });

    // Log audit
    logAudit({
      action: 'expense_created',
      resource: 'expense',
      resourceId: expenseId,
      performedBy: currentUser.username,
      performedByName: currentUser.name,
      metadata: newExpense,
      success: true
    });

    return { success: true, expense: newExpense };
  };

  // Approve expense
  const approveExpense = (expenseId) => {
    if (!requirePermission(currentUser, 'approve', 'expense')) {
      logAudit({
        action: 'permission_denied',
        resource: 'expense',
        resourceId: expenseId,
        performedBy: currentUser?.username || 'unknown',
        performedByName: currentUser?.name || 'Unknown',
        metadata: { action: 'approve' },
        success: false,
        errorMessage: 'Insufficient permissions'
      });
      return { success: false, message: 'Insufficient permissions' };
    }

    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) {
      return { success: false, message: 'Expense not found' };
    }

    const approvalData = {
      id: expenseId,
      approvedBy: currentUser.username,
      approvedByName: currentUser.name,
      approvedDate: new Date().toISOString()
    };

    expenseDispatch({ type: 'APPROVE_EXPENSE', payload: approvalData });

    // Log audit
    logAudit({
      action: 'expense_approved',
      resource: 'expense',
      resourceId: expenseId,
      performedBy: currentUser.username,
      performedByName: currentUser.name,
      metadata: { expense, approval: approvalData },
      success: true
    });

    return { success: true };
  };

  // Reject expense
  const rejectExpense = (expenseId) => {
    if (!requirePermission(currentUser, 'approve', 'expense')) {
      logAudit({
        action: 'permission_denied',
        resource: 'expense',
        resourceId: expenseId,
        performedBy: currentUser?.username || 'unknown',
        performedByName: currentUser?.name || 'Unknown',
        metadata: { action: 'reject' },
        success: false,
        errorMessage: 'Insufficient permissions'
      });
      return { success: false, message: 'Insufficient permissions' };
    }

    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) {
      return { success: false, message: 'Expense not found' };
    }

    const rejectionData = {
      id: expenseId,
      rejectedBy: currentUser.username,
      rejectedByName: currentUser.name,
      rejectedDate: new Date().toISOString()
    };

    expenseDispatch({ type: 'REJECT_EXPENSE', payload: rejectionData });

    // Log audit
    logAudit({
      action: 'expense_rejected',
      resource: 'expense',
      resourceId: expenseId,
      performedBy: currentUser.username,
      performedByName: currentUser.name,
      metadata: { expense, rejection: rejectionData },
      success: true
    });

    return { success: true };
  };

  // Delete expense
  const deleteExpense = (expenseId) => {
    if (!requirePermission(currentUser, 'delete', 'expense')) {
      logAudit({
        action: 'permission_denied',
        resource: 'expense',
        resourceId: expenseId,
        performedBy: currentUser?.username || 'unknown',
        performedByName: currentUser?.name || 'Unknown',
        metadata: { action: 'delete' },
        success: false,
        errorMessage: 'Insufficient permissions'
      });
      return { success: false, message: 'Insufficient permissions' };
    }

    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) {
      return { success: false, message: 'Expense not found' };
    }

    expenseDispatch({ type: 'DELETE_EXPENSE', payload: expenseId });

    // Log audit
    logAudit({
      action: 'expense_deleted',
      resource: 'expense',
      resourceId: expenseId,
      performedBy: currentUser.username,
      performedByName: currentUser.name,
      metadata: expense,
      success: true
    });

    return { success: true };
  };

  // Get filtered expenses
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
