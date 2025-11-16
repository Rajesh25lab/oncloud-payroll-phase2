// Approval Workflow System
// Manages expense approval states and transitions

export const APPROVAL_STATES = {
  DRAFT: 'draft',           // Created but not submitted
  PENDING: 'pending',       // Submitted, awaiting approval
  APPROVED: 'approved',     // Approved by admin/manager
  REJECTED: 'rejected',     // Rejected by admin/manager
  PAID: 'paid',            // Payment processed
  CANCELLED: 'cancelled'    // Cancelled by submitter
};

export const STATE_LABELS = {
  [APPROVAL_STATES.DRAFT]: 'Draft',
  [APPROVAL_STATES.PENDING]: 'Pending Approval',
  [APPROVAL_STATES.APPROVED]: 'Approved',
  [APPROVAL_STATES.REJECTED]: 'Rejected',
  [APPROVAL_STATES.PAID]: 'Paid',
  [APPROVAL_STATES.CANCELLED]: 'Cancelled'
};

export const STATE_COLORS = {
  [APPROVAL_STATES.DRAFT]: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', badge: 'bg-gray-200' },
  [APPROVAL_STATES.PENDING]: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', badge: 'bg-yellow-200' },
  [APPROVAL_STATES.APPROVED]: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', badge: 'bg-green-200' },
  [APPROVAL_STATES.REJECTED]: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', badge: 'bg-red-200' },
  [APPROVAL_STATES.PAID]: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', badge: 'bg-blue-200' },
  [APPROVAL_STATES.CANCELLED]: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-600', badge: 'bg-gray-200' }
};

// Valid state transitions
export const VALID_TRANSITIONS = {
  [APPROVAL_STATES.DRAFT]: [APPROVAL_STATES.PENDING, APPROVAL_STATES.CANCELLED],
  [APPROVAL_STATES.PENDING]: [APPROVAL_STATES.APPROVED, APPROVAL_STATES.REJECTED, APPROVAL_STATES.CANCELLED],
  [APPROVAL_STATES.APPROVED]: [APPROVAL_STATES.PAID],
  [APPROVAL_STATES.REJECTED]: [],
  [APPROVAL_STATES.PAID]: [],
  [APPROVAL_STATES.CANCELLED]: []
};

// Check if transition is valid
export const canTransition = (fromState, toState) => {
  const validTransitions = VALID_TRANSITIONS[fromState] || [];
  return validTransitions.includes(toState);
};

// Get available actions for current state
export const getAvailableActions = (expense, currentUser) => {
  const actions = [];
  const state = expense.status || APPROVAL_STATES.DRAFT;

  // Submitter actions
  if (expense.submittedBy === currentUser.username) {
    if (state === APPROVAL_STATES.DRAFT) {
      actions.push({ action: 'submit', label: 'Submit for Approval', color: 'blue' });
    }
    if (state === APPROVAL_STATES.PENDING || state === APPROVAL_STATES.DRAFT) {
      actions.push({ action: 'cancel', label: 'Cancel', color: 'gray' });
    }
  }

  // Approver actions (admin/manager)
  if (currentUser.role === 'admin' || currentUser.role === 'manager') {
    if (state === APPROVAL_STATES.PENDING) {
      actions.push({ action: 'approve', label: 'Approve', color: 'green' });
      actions.push({ action: 'reject', label: 'Reject', color: 'red' });
    }
    if (state === APPROVAL_STATES.APPROVED) {
      actions.push({ action: 'mark_paid', label: 'Mark as Paid', color: 'blue' });
    }
  }

  return actions;
};

// Create approval record
export const createApprovalRecord = (expense, action, currentUser, notes = '') => {
  return {
    id: `APR-${Date.now()}`,
    expenseId: expense.id,
    action,
    performedBy: currentUser.username,
    performedByName: currentUser.name,
    performedDate: new Date().toISOString(),
    previousState: expense.status,
    newState: getNewState(expense.status, action),
    notes,
    userRole: currentUser.role
  };
};

// Get new state based on action
const getNewState = (currentState, action) => {
  const transitions = {
    submit: APPROVAL_STATES.PENDING,
    approve: APPROVAL_STATES.APPROVED,
    reject: APPROVAL_STATES.REJECTED,
    cancel: APPROVAL_STATES.CANCELLED,
    mark_paid: APPROVAL_STATES.PAID
  };
  return transitions[action] || currentState;
};

// Calculate approval summary
export const getApprovalSummary = (expenses) => {
  const summary = {
    total: expenses.length,
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    paid: 0,
    cancelled: 0,
    totalAmount: 0,
    pendingAmount: 0,
    approvedAmount: 0
  };

  expenses.forEach(exp => {
    const amount = parseFloat(exp.amount) || 0;
    summary.totalAmount += amount;

    switch (exp.status) {
      case APPROVAL_STATES.DRAFT:
        summary.draft++;
        break;
      case APPROVAL_STATES.PENDING:
        summary.pending++;
        summary.pendingAmount += amount;
        break;
      case APPROVAL_STATES.APPROVED:
        summary.approved++;
        summary.approvedAmount += amount;
        break;
      case APPROVAL_STATES.REJECTED:
        summary.rejected++;
        break;
      case APPROVAL_STATES.PAID:
        summary.paid++;
        break;
      case APPROVAL_STATES.CANCELLED:
        summary.cancelled++;
        break;
    }
  });

  return summary;
};

// Get expense timeline
export const getExpenseTimeline = (expense) => {
  const timeline = [];

  // Created
  timeline.push({
    event: 'Created',
    date: expense.submittedDate,
    user: expense.submittedByName,
    icon: '📝',
    color: 'blue'
  });

  // Submitted (if not auto-submitted)
  if (expense.submittedDate !== expense.createdDate) {
    timeline.push({
      event: 'Submitted for Approval',
      date: expense.submittedDate,
      user: expense.submittedByName,
      icon: '📤',
      color: 'blue'
    });
  }

  // Approved/Rejected
  if (expense.approvedDate) {
    timeline.push({
      event: 'Approved',
      date: expense.approvedDate,
      user: expense.approvedByName,
      icon: '✅',
      color: 'green',
      notes: expense.approvalNotes
    });
  } else if (expense.rejectedDate) {
    timeline.push({
      event: 'Rejected',
      date: expense.rejectedDate,
      user: expense.rejectedByName,
      icon: '❌',
      color: 'red',
      notes: expense.rejectionReason
    });
  }

  // Paid
  if (expense.paidDate) {
    timeline.push({
      event: 'Payment Processed',
      date: expense.paidDate,
      user: expense.paidByName,
      icon: '💰',
      color: 'blue'
    });
  }

  // Cancelled
  if (expense.cancelledDate) {
    timeline.push({
      event: 'Cancelled',
      date: expense.cancelledDate,
      user: expense.cancelledByName,
      icon: '🚫',
      color: 'gray',
      notes: expense.cancellationReason
    });
  }

  return timeline;
};

// Validate approval action
export const validateApprovalAction = (expense, action, currentUser) => {
  const errors = [];

  // Check if action is valid for current state
  const newState = getNewState(expense.status, action);
  if (!canTransition(expense.status, newState)) {
    errors.push(`Cannot ${action} expense in ${expense.status} state`);
  }

  // Check permissions
  if (action === 'approve' || action === 'reject') {
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      errors.push('Only administrators and managers can approve/reject expenses');
    }
    // Cannot approve own expense
    if (expense.submittedBy === currentUser.username) {
      errors.push('You cannot approve your own expense');
    }
  }

  if (action === 'submit' || action === 'cancel') {
    if (expense.submittedBy !== currentUser.username) {
      errors.push('Only the submitter can perform this action');
    }
  }

  if (action === 'mark_paid') {
    if (currentUser.role !== 'admin') {
      errors.push('Only administrators can mark expenses as paid');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Format approval notification
export const formatApprovalNotification = (expense, action, currentUser) => {
  const messages = {
    submit: `Expense #${expense.id} submitted for approval by ${currentUser.name}`,
    approve: `Expense #${expense.id} approved by ${currentUser.name}`,
    reject: `Expense #${expense.id} rejected by ${currentUser.name}`,
    cancel: `Expense #${expense.id} cancelled by ${currentUser.name}`,
    mark_paid: `Expense #${expense.id} marked as paid by ${currentUser.name}`
  };

  return {
    title: messages[action] || 'Expense Updated',
    message: `${expense.type} - ${expense.payeeName} - ₹${expense.amount}`,
    timestamp: new Date().toLocaleString()
  };
};

export default {
  APPROVAL_STATES,
  STATE_LABELS,
  STATE_COLORS,
  canTransition,
  getAvailableActions,
  createApprovalRecord,
  getApprovalSummary,
  getExpenseTimeline,
  validateApprovalAction,
  formatApprovalNotification
};
