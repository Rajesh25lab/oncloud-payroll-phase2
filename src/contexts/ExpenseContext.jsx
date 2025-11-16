import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';

const ExpenseContext = createContext();

// Expense reducer
const expenseReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_EXPENSES':
      return {
        ...state,
        expenses: action.payload,
        loading: false
      };
    
    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [...state.expenses, action.payload]
      };
    
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(expense =>
          expense.id === action.payload.id
            ? { ...expense, ...action.payload }
            : expense
        )
      };
    
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter(expense => expense.id !== action.payload)
      };
    
    case 'APPROVE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(expense =>
          expense.id === action.payload.id
            ? {
                ...expense,
                status: 'approved',
                approvedBy: action.payload.approvedBy,
                approvedByName: action.payload.approvedByName,
                approvedDate: action.payload.approvedDate
              }
            : expense
        )
      };
    
    case 'REJECT_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(expense =>
          expense.id === action.payload.id
            ? {
                ...expense,
                status: 'rejected',
                rejectedBy: action.payload.rejectedBy,
                rejectedByName: action.payload.rejectedByName,
                rejectedDate: action.payload.rejectedDate
              }
            : expense
        )
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    
    default:
      return state;
  }
};

// Initial state
const initialState = {
  expenses: [],
  loading: true
};

// Provider component
export const ExpenseProvider = ({ children }) => {
  const [state, dispatch] = useReducer(expenseReducer, initialState);

  // Load expenses from localStorage on mount
  useEffect(() => {
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
      try {
        const expenses = JSON.parse(savedExpenses);
        dispatch({ type: 'LOAD_EXPENSES', payload: expenses });
      } catch (error) {
        console.error('Failed to parse saved expenses:', error);
        dispatch({ type: 'LOAD_EXPENSES', payload: [] });
      }
    } else {
      dispatch({ type: 'LOAD_EXPENSES', payload: [] });
    }
  }, []);

  // Save expenses to localStorage when they change
  useEffect(() => {
    if (!state.loading) {
      localStorage.setItem('expenses', JSON.stringify(state.expenses));
    }
  }, [state.expenses, state.loading]);

  // Computed selectors (memoized for performance)
  const pendingExpenses = useMemo(
    () => state.expenses.filter(e => e.status === 'pending'),
    [state.expenses]
  );

  const approvedExpenses = useMemo(
    () => state.expenses.filter(e => e.status === 'approved'),
    [state.expenses]
  );

  const rejectedExpenses = useMemo(
    () => state.expenses.filter(e => e.status === 'rejected'),
    [state.expenses]
  );

  const value = {
    expenses: state.expenses,
    pendingExpenses,
    approvedExpenses,
    rejectedExpenses,
    loading: state.loading,
    dispatch
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};

// Custom hook
export const useExpenseContext = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenseContext must be used within ExpenseProvider');
  }
  return context;
};
