import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuditContext = createContext();

// Audit reducer
const auditReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_AUDIT_LOGS':
      return {
        ...state,
        auditLogs: action.payload,
        loading: false
      };
    
    case 'ADD_AUDIT_LOG':
      return {
        ...state,
        auditLogs: [action.payload, ...state.auditLogs] // Prepend for newest first
      };
    
    case 'CLEAR_AUDIT_LOGS':
      return {
        ...state,
        auditLogs: []
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
  auditLogs: [],
  loading: true
};

// Provider component
export const AuditProvider = ({ children }) => {
  const [state, dispatch] = useReducer(auditReducer, initialState);

  // Load audit logs from localStorage on mount
  useEffect(() => {
    const savedLogs = localStorage.getItem('auditLogs');
    if (savedLogs) {
      try {
        const logs = JSON.parse(savedLogs);
        dispatch({ type: 'LOAD_AUDIT_LOGS', payload: logs });
      } catch (error) {
        console.error('Failed to parse saved audit logs:', error);
        dispatch({ type: 'LOAD_AUDIT_LOGS', payload: [] });
      }
    } else {
      dispatch({ type: 'LOAD_AUDIT_LOGS', payload: [] });
    }
  }, []);

  // Save audit logs to localStorage when they change
  useEffect(() => {
    if (!state.loading) {
      // Keep only last 1000 audit logs to prevent localStorage overflow
      const logsToSave = state.auditLogs.slice(0, 1000);
      localStorage.setItem('auditLogs', JSON.stringify(logsToSave));
    }
  }, [state.auditLogs, state.loading]);

  // Helper function to add audit log
  const logAudit = (logData) => {
    const auditEntry = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...logData
    };
    dispatch({ type: 'ADD_AUDIT_LOG', payload: auditEntry });
  };

  const value = {
    auditLogs: state.auditLogs,
    loading: state.loading,
    dispatch,
    logAudit
  };

  return (
    <AuditContext.Provider value={value}>
      {children}
    </AuditContext.Provider>
  );
};

// Custom hook
export const useAudit = () => {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error('useAudit must be used within AuditProvider');
  }
  return context;
};
