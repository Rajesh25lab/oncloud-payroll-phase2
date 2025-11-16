import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveToStorage, loadFromStorage } from '../utils/storage';
import { DEFAULT_USER, INITIAL_VENDORS } from '../config/constants';
import { generateId } from '../utils/exportUtils';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // Core state
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [masterData, setMasterData] = useState({ employees: {}, vendors: {}, users: {} });
  const [expenses, setExpenses] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [fileLogs, setFileLogs] = useState([]);
  const [pendingDuplicates, setPendingDuplicates] = useState({ vendors: [], employees: [] });

  // UI state
  const [errors, setErrors] = useState([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorContext, setErrorContext] = useState('general');

  // Initialize data from localStorage
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) {
      setMasterData(saved.masterData || { employees: {}, vendors: {}, users: {} });
      setExpenses(saved.expenses || []);
      setAuditLogs(saved.auditLogs || []);
      setFileLogs(saved.fileLogs || []);
      setPendingDuplicates(saved.pendingDuplicates || { vendors: [], employees: [] });
    } else {
      // Initialize with defaults
      const initialData = {
        employees: {},
        vendors: {},
        users: {
          'admin': DEFAULT_USER
        }
      };
      
      // Add initial vendors
      INITIAL_VENDORS.forEach(vendor => {
        initialData.vendors[vendor.id] = {
          ...vendor,
          type: 'vendor',
          addedDate: new Date().toISOString()
        };
      });
      
      setMasterData(initialData);
      saveToStorage({ 
        masterData: initialData, 
        expenses: [], 
        auditLogs: [], 
        fileLogs: [], 
        pendingDuplicates: { vendors: [], employees: [] } 
      });
    }
  }, []);

  // Auto-save when data changes
  useEffect(() => {
    if (currentUser) {
      saveToStorage({ masterData, expenses, auditLogs, fileLogs, pendingDuplicates });
    }
  }, [masterData, expenses, auditLogs, fileLogs, pendingDuplicates, currentUser]);

  // Helper: Show errors in modal
  const showErrors = (errorList, context = 'general') => {
    setErrors(errorList);
    setErrorContext(context);
    setShowErrorModal(true);
  };

  const value = {
    // State
    currentUser,
    setCurrentUser,
    currentView,
    setCurrentView,
    masterData,
    setMasterData,
    expenses,
    setExpenses,
    auditLogs,
    setAuditLogs,
    fileLogs,
    setFileLogs,
    pendingDuplicates,
    setPendingDuplicates,
    errors,
    setErrors,
    showErrorModal,
    setShowErrorModal,
    errorContext,
    
    // Helpers
    showErrors
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
