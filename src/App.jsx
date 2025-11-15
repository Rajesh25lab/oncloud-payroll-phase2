import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Home, DollarSign, Users, AlertCircle, CheckCircle, Trash2, Plus, List, LogOut, User, Settings, Database, Receipt, FileSpreadsheet, Eye, EyeOff, Camera, Zap } from 'lucide-react';

// Import utilities
import { findBestMatch, getConfidenceLabel, needsConfirmation } from './utils/fuzzyMatching';
import { validateExpenseAmount, checkDuplicateExpense, validateBulkRow, formatDate, parseDateToISO } from './utils/validation';
import { downloadExpenseTemplate, downloadVendorTemplate, downloadEmployeeTemplate, downloadMasterDataLists, exportExpenses, exportMasterData, parseCSVData, generateId, generateJournalNumber } from './utils/exportUtils';
import { saveToStorage, loadFromStorage } from './utils/storage';
import { CONFIG, INITIAL_VENDORS, DEFAULT_USER } from './config/constants';
import { logFileOperation, logAudit, hasPermission, requirePermission, searchFiles, searchAuditLogs, exportAuditLogs, getCategoryIcon, getStatusColor, formatFileSize, formatRelativeTime, ROLE_NAMES } from './utils/enterpriseUtils';
import { createAuditLog, createFileLog, hasPermission, formatAuditLog, filterAuditLogs, filterFileLogs, exportAuditLogToCSV, exportFileLogToCSV } from './utils/auditUtils';

function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '', showPassword: false });
  
  // App state
  const [currentView, setCurrentView] = useState('home');
  const [masterData, setMasterData] = useState({
    employees: {},
    vendors: {},
    users: {}
  });
  
  // Expense state
  const [expenses, setExpenses] = useState([]);
  
  // Enterprise modules state
  const [auditLogs, setAuditLogs] = useState([]);
  const [fileLogs, setFileLogs] = useState([]);
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Petrol',
    payeeType: 'vendor',
    payeeId: '',
    payeeName: '',
    forSelf: true,
    forEmployeeId: '',
    amount: '',
    receiptNo: '',
    narration: '',
    reason: '',
    bankName: '',
    ifsc: '',
    accountNo: '',
    branch: ''
  });
  
  // Bulk upload state
  const [bulkUploadResults, setBulkUploadResults] = useState(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  
  // Vendor form state
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    bank: '',
    ifsc: '',
    accountNo: '',
    branch: '',
    status: 'Active'
  });
  
  // Employee form state
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    empId: '',
    name: '',
    department: '',
    designation: '',
    bankName: '',
    ifsc: '',
    accountNo: '',
    branch: '',
    accountType: 'Saving'
  });
  
  // AI Receipt state
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [receiptProcessing, setReceiptProcessing] = useState(false);
  
  // Payroll batch state
  const [paymentBatch, setPaymentBatch] = useState({
    monthly: null,
    weekly: null
  });
  
  const [errors, setErrors] = useState([]);

  // Initialize app - load from localStorage
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) {
      setMasterData(saved.masterData || { employees: {}, vendors: {}, users: {} });
      setExpenses(saved.expenses || []);
      setAuditLogs(saved.auditLogs || []);
      setFileLogs(saved.fileLogs || []);
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
      saveToStorage({ masterData: initialData, expenses: [], auditLogs: [], fileLogs: [] });
    }
  }, []);

  // Auto-save when data changes
  useEffect(() => {
    if (currentUser) {
      saveToStorage({ masterData, expenses, auditLogs, fileLogs });
    }
  }, [masterData, expenses, auditLogs, fileLogs, currentUser]);

  // Helper to add audit log
  const addAuditLog = (action, resource, resourceId, before = null, after = null, metadata = {}) => {
    const log = createAuditLog(currentUser, action, resource, resourceId, before, after, metadata);
    setAuditLogs(prev => [log, ...prev]); // Newest first
  };

  // Helper to add file log
  const addFileLog = (operation, file, metadata = {}) => {
    const log = createFileLog(currentUser, operation, file, metadata);
    setFileLogs(prev => [log, ...prev]); // Newest first
  };

  // Login handler
  const handleLogin = () => {
    const { username, password } = loginForm;
    const user = masterData.users[username];
    
    if (user && user.password === password) {
      setCurrentUser(user);
      setShowLogin(false);
      setLoginForm({ username: '', password: '', showPassword: false });
      setErrors([]);
      
      // Log successful login
      logAudit(auditLogs, setAuditLogs, 'login', 'auth', username, null, { username, success: true }, user);
    } else {
      setErrors(['Invalid username or password']);
      
      // Log failed login attempt
      const tempUser = { username: username || 'unknown', name: username || 'unknown', role: 'unknown' };
      logAudit(auditLogs, setAuditLogs, 'login_failed', 'auth', username, null, null, tempUser, false, 'Invalid credentials');
    }
  };

  // Logout handler
  const handleLogout = () => {
    // Log logout
    logAudit(auditLogs, setAuditLogs, 'logout', 'auth', currentUser.username, null, null, currentUser);
    
    setCurrentUser(null);
    setShowLogin(true);
    setCurrentView('home');
  };

  // Import employees from payroll CSV
  const importEmployeesFromPayroll = (employees) => {
    const newEmployees = { ...masterData.employees };
    let importCount = 0;
    
    employees.forEach(emp => {
      const empId = emp['Emp ID'];
      if (empId && empId.startsWith('E')) {
        if (!newEmployees[empId] || newEmployees[empId].lastUpdated < new Date().toISOString()) {
          newEmployees[empId] = {
            empId: empId,
            name: emp.Name || '',
            type: 'employee',
            department: emp['Dept.'] || '',
            designation: emp.Designation || '',
            bankName: emp['Bank Name'] || '',
            ifsc: emp['IFSC Code'] || '',
            accountNo: emp['Bank Account No'] || '',
            branch: emp['Bank Branch Name'] || '',
            accountType: emp['Account Type'] || '',
            lastUpdated: new Date().toISOString(),
            source: 'payroll_import'
          };
          importCount++;
        }
      }
    });
    
    setMasterData({ ...masterData, employees: newEmployees });
    return importCount;
  };

  // Handle payee selection
  const handlePayeeSelect = (e) => {
    const payeeId = e.target.value;
    setExpenseForm({ ...expenseForm, payeeId });
    
    if (expenseForm.payeeType === 'vendor') {
      const vendor = masterData.vendors[payeeId];
      if (vendor) {
        setExpenseForm({
          ...expenseForm,
          payeeId,
          payeeName: vendor.name,
          bankName: vendor.bank,
          ifsc: vendor.ifsc,
          accountNo: vendor.accountNo,
          branch: vendor.branch || ''
        });
      }
    } else if (expenseForm.payeeType === 'employee') {
      const employee = masterData.employees[payeeId];
      if (employee) {
        setExpenseForm({
          ...expenseForm,
          payeeId,
          payeeName: employee.name,
          bankName: employee.bankName,
          ifsc: employee.ifsc,
          accountNo: employee.accountNo,
          branch: employee.branch || ''
        });
      }
    }
  };

  // Add expense
  const addExpense = () => {
    const validation = validateExpenseAmount(expenseForm.type, expenseForm.amount);
    const duplicates = checkDuplicateExpense(expenseForm, expenses);
    
    const warnings = [...(validation.warnings || [])];
    if (duplicates) {
      warnings.push(`Possible duplicate: Similar expense found on ${duplicates[0].date}`);
    }
    
    if (!expenseForm.amount || !expenseForm.payeeName) {
      setErrors(['Please fill in amount and payee name']);
      return;
    }
    
    let crAccount = currentUser.name;
    if (!expenseForm.forSelf && expenseForm.forEmployeeId) {
      const employee = masterData.employees[expenseForm.forEmployeeId];
      crAccount = employee ? employee.name : currentUser.name;
    }
    
    const config = CONFIG.expenseTypes[expenseForm.type];
    const expense = {
      id: generateId('EXP'),
      ...expenseForm,
      crAccount: crAccount,
      drAccount: config.dr,
      tds: config.tds,
      tdsRate: config.rate,
      submittedBy: currentUser.username,
      submittedByName: currentUser.name,
      submittedDate: new Date().toISOString(),
      status: 'pending',
      warnings: warnings
    };
    
    setExpenses([...expenses, expense]);
    
    // Log audit
    logAudit(auditLogs, setAuditLogs, 'expense_created', 'expense', expense.id, null, expense, currentUser);
    
    // Reset form
    setExpenseForm({
      date: new Date().toISOString().split('T')[0],
      type: 'Petrol',
      payeeType: 'vendor',
      payeeId: '',
      payeeName: '',
      forSelf: true,
      forEmployeeId: '',
      amount: '',
      receiptNo: '',
      narration: '',
      reason: '',
      bankName: '',
      ifsc: '',
      accountNo: '',
      branch: ''
    });
    
    setErrors([]);
  };

  // Approve expense
  const approveExpense = (expenseId) => {
    // Check permission
    if (!requirePermission(currentUser, 'approve', 'expense')) {
      logAudit(auditLogs, setAuditLogs, 'permission_denied', 'expense', expenseId, null, { action: 'approve' }, currentUser, false, 'Insufficient permissions');
      return;
    }
    
    const expense = expenses.find(e => e.id === expenseId);
    const updatedExpense = {
      ...expense,
      status: 'approved',
      approvedBy: currentUser.username,
      approvedByName: currentUser.name,
      approvedDate: new Date().toISOString()
    };
    
    setExpenses(expenses.map(e => e.id === expenseId ? updatedExpense : e));
    
    // Log audit
    logAudit(auditLogs, setAuditLogs, 'expense_approved', 'expense', expenseId, expense, updatedExpense, currentUser);
  };

  // Reject expense
  const rejectExpense = (expenseId) => {
    // Check permission
    if (!requirePermission(currentUser, 'approve', 'expense')) {
      logAudit(auditLogs, setAuditLogs, 'permission_denied', 'expense', expenseId, null, { action: 'reject' }, currentUser, false, 'Insufficient permissions');
      return;
    }
    
    const expense = expenses.find(e => e.id === expenseId);
    const updatedExpense = {
      ...expense,
      status: 'rejected',
      rejectedBy: currentUser.username,
      rejectedByName: currentUser.name,
      rejectedDate: new Date().toISOString()
    };
    
    setExpenses(expenses.map(e => e.id === expenseId ? updatedExpense : e));
    
    // Log audit
    logAudit(auditLogs, setAuditLogs, 'expense_rejected', 'expense', expenseId, expense, updatedExpense, currentUser);
  };

  // Handle bulk Excel upload
  const handleBulkUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = parseCSVData(text);
      
      const results = {
        total: data.length,
        valid: [],
        warnings: [],
        errors: []
      };
      
      data.forEach((row, idx) => {
        const rowNum = idx + 2;
        const { errors: rowErrors, warnings: rowWarnings } = validateBulkRow(row, rowNum);
        
        if (rowErrors.length > 0) {
          results.errors.push({ row: rowNum, data: row, errors: rowErrors });
          return;
        }
        
        const allWarnings = [...rowWarnings];
        
        // Try to match payee
        const payeeType = row['Payee Type']?.toLowerCase() || 'vendor';
        let payeeMatch = null;
        
        if (payeeType.includes('vendor')) {
          payeeMatch = findBestMatch(row['Payee Name'], Object.values(masterData.vendors));
        } else if (payeeType.includes('employee')) {
          payeeMatch = findBestMatch(row['Payee Name'], Object.values(masterData.employees));
        }
        
        if (payeeMatch && needsConfirmation(payeeMatch.confidence)) {
          allWarnings.push(`Fuzzy match: "${row['Payee Name']}" → "${payeeMatch.match.name}" (${Math.round(payeeMatch.confidence * 100)}%)`);
        } else if (!payeeMatch && payeeType !== 'other') {
          allWarnings.push(`Payee not found in master data: ${row['Payee Name']}`);
        }
        
        // Validate amount
        if (row['Type'] && CONFIG.expenseTypes[row['Type']]) {
          const validation = validateExpenseAmount(row['Type'], row['Amount']);
          if (validation.warnings) {
            allWarnings.push(...validation.warnings);
          }
        }
        
        // Check duplicates
        const similarExpense = expenses.find(exp => {
          const sameDate = exp.date === (row['Date'] || formatDate());
          const sameType = exp.type === row['Type'];
          const sameAmount = Math.abs(parseFloat(exp.amount) - parseFloat(row['Amount'])) < 0.01;
          return sameDate && sameType && sameAmount && exp.status !== 'rejected';
        });
        
        if (similarExpense) {
          allWarnings.push('Possible duplicate expense');
        }
        
        const processedRow = {
          row: rowNum,
          data: row,
          payeeMatch: payeeMatch,
          warnings: allWarnings
        };
        
        if (allWarnings.length > 0) {
          results.warnings.push(processedRow);
        } else {
          results.valid.push(processedRow);
        }
      });
      
      setBulkUploadResults(results);
      setErrors([]);
      
      // Log file upload
      logFileOperation(fileLogs, setFileLogs, 'upload', file, {
        type: 'expense_upload',
        status: results.errors.length === 0 ? 'processed' : (results.valid.length > 0 ? 'partial' : 'error'),
        rowCount: results.total,
        validRows: results.valid.length,
        errorRows: results.errors.length,
        errors: results.errors.map(e => `Row ${e.row}: ${e.errors.join(', ')}`),
        fileName: file.name
      }, currentUser);
      
      // Log audit
      logAudit(auditLogs, setAuditLogs, 'file_uploaded', 'file', file.name, null, { 
        rowCount: results.total, 
        validRows: results.valid.length,
        errorRows: results.errors.length 
      }, currentUser, true, null);
      
    } catch (error) {
      setErrors([`Error reading file: ${error.message}`]);
      
      // Log failed upload
      logFileOperation(fileLogs, setFileLogs, 'upload', file, {
        type: 'expense_upload',
        status: 'error',
        rowCount: 0,
        validRows: 0,
        errorRows: 0,
        errors: [error.message],
        fileName: file?.name || 'unknown'
      }, currentUser);
      
      logAudit(auditLogs, setAuditLogs, 'file_upload_failed', 'file', file?.name || 'unknown', null, null, currentUser, false, error.message);
    }
  };

  // Import bulk expenses
  const importBulkExpenses = () => {
    if (!bulkUploadResults) return;
    
    const newExpenses = [];
    const allRows = [...bulkUploadResults.valid, ...bulkUploadResults.warnings];
    
    allRows.forEach(item => {
      const row = item.data;
      const config = CONFIG.expenseTypes[row['Type']] || CONFIG.expenseTypes['Other'];
      
      let payeeName = row['Payee Name'] || row['Payee/Vendor'] || row['Payee'];
      let payeeId = '';
      let bankName = '';
      let ifsc = '';
      let accountNo = '';
      let branch = '';
      
      if (item.payeeMatch) {
        const match = item.payeeMatch.match;
        payeeName = match.name;
        payeeId = match.id || match.empId || '';
        bankName = match.bank || match.bankName || '';
        ifsc = match.ifsc || '';
        accountNo = match.accountNo || '';
        branch = match.branch || '';
      }
      
      const forEmployeeId = row['For Employee ID'] || '';
      let crAccount = currentUser.name;
      if (forEmployeeId) {
        const emp = masterData.employees[forEmployeeId];
        crAccount = emp ? emp.name : currentUser.name;
      }
      
      const expense = {
        id: generateId('EXP'),
        date: row['Date'] || new Date().toISOString().split('T')[0],
        type: row['Type'],
        payeeType: row['Payee Type']?.toLowerCase() || 'vendor',
        payeeId: payeeId,
        payeeName: payeeName,
        amount: parseFloat(row['Amount']),
        receiptNo: row['Receipt#'] || '',
        reason: row['Reason'] || '',
        narration: row['Narration'] || `${row['Type']} expense - ${payeeName}`,
        bankName: bankName,
        ifsc: ifsc,
        accountNo: accountNo,
        branch: branch,
        crAccount: crAccount,
        drAccount: config.dr,
        tds: config.tds,
        tdsRate: config.rate,
        submittedBy: currentUser.username,
        submittedByName: currentUser.name,
        submittedDate: new Date().toISOString(),
        status: 'pending',
        warnings: item.warnings || [],
        source: 'bulk_upload'
      };
      
      newExpenses.push(expense);
    });
    
    setExpenses([...expenses, ...newExpenses]);
    setBulkUploadResults(null);
    alert(`✅ Imported ${newExpenses.length} expenses successfully!`);
  };

  // Handle bulk vendor import
  const handleVendorImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = parseCSVData(text);
      
      if (data.length === 0) {
        setErrors(['No data found in file']);
        return;
      }
      
      const newVendors = { ...masterData.vendors };
      let importCount = 0;
      const errors = [];
      
      data.forEach((row, idx) => {
        const vendorName = row['Vendor Name'];
        const bankName = row['Bank Name'];
        const ifsc = row['IFSC Code'];
        const accountNo = row['Account Number'];
        
        if (!vendorName || !bankName || !ifsc || !accountNo) {
          errors.push(`Row ${idx + 2}: Missing required fields`);
          return;
        }
        
        const vendorId = generateId('VEN');
        newVendors[vendorId] = {
          id: vendorId,
          name: vendorName,
          bank: bankName,
          ifsc: ifsc.toUpperCase(),
          accountNo: accountNo,
          branch: row['Branch'] || '',
          status: row['Status'] || 'Active',
          type: 'vendor',
          addedDate: new Date().toISOString(),
          source: 'bulk_import'
        };
        importCount++;
      });
      
      if (errors.length > 0) {
        setErrors(errors);
        return;
      }
      
      setMasterData({ ...masterData, vendors: newVendors });
      setErrors([]);
      alert(`✅ Imported ${importCount} vendors successfully!`);
      
      // Log file operation
      logFileOperation(fileLogs, setFileLogs, 'upload', file, {
        type: 'vendor_import',
        status: 'processed',
        rowCount: data.length,
        validRows: importCount,
        errorRows: 0,
        errors: [],
        fileName: file.name
      }, currentUser);
      
      // Log audit
      logAudit(auditLogs, setAuditLogs, 'vendors_imported', 'vendor', null, null, { count: importCount }, currentUser);
      
    } catch (error) {
      setErrors([`Error importing vendors: ${error.message}`]);
      
      // Log failed import
      if (file) {
        logFileOperation(fileLogs, setFileLogs, 'upload', file, {
          type: 'vendor_import',
          status: 'error',
          rowCount: 0,
          validRows: 0,
          errorRows: 0,
          errors: [error.message],
          fileName: file.name
        }, currentUser);
      }
      
      logAudit(auditLogs, setAuditLogs, 'vendor_import_failed', 'vendor', null, null, null, currentUser, false, error.message);
    }
  };

  // Handle bulk employee import
  const handleEmployeeImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = parseCSVData(text);
      
      if (data.length === 0) {
        setErrors(['No data found in file']);
        return;
      }
      
      const newEmployees = { ...masterData.employees };
      let importCount = 0;
      const errors = [];
      
      data.forEach((row, idx) => {
        const empId = row['Emp ID'];
        const name = row['Name'];
        const bankName = row['Bank Name'];
        const ifsc = row['IFSC Code'];
        const accountNo = row['Account Number'];
        
        if (!empId || !name || !bankName || !ifsc || !accountNo) {
          errors.push(`Row ${idx + 2}: Missing required fields`);
          return;
        }
        
        if (!empId.startsWith('E')) {
          errors.push(`Row ${idx + 2}: Emp ID must start with 'E' (example: E0001)`);
          return;
        }
        
        newEmployees[empId] = {
          empId: empId,
          name: name,
          type: 'employee',
          department: row['Department'] || '',
          designation: row['Designation'] || '',
          bankName: bankName,
          ifsc: ifsc.toUpperCase(),
          accountNo: accountNo,
          branch: row['Branch'] || '',
          accountType: row['Account Type'] || '',
          addedDate: new Date().toISOString(),
          source: 'bulk_import'
        };
        importCount++;
      });
      
      if (errors.length > 0) {
        setErrors(errors);
        return;
      }
      
      setMasterData({ ...masterData, employees: newEmployees });
      setErrors([]);
      alert(`✅ Imported ${importCount} employees successfully!`);
      
      // Log file operation
      logFileOperation(fileLogs, setFileLogs, 'upload', file, {
        type: 'employee_import',
        status: 'processed',
        rowCount: data.length,
        validRows: importCount,
        errorRows: 0,
        errors: [],
        fileName: file.name
      }, currentUser);
      
      // Log audit
      logAudit(auditLogs, setAuditLogs, 'employees_imported', 'employee', null, null, { count: importCount }, currentUser);
      
    } catch (error) {
      setErrors([`Error importing employees: ${error.message}`]);
      
      // Log failed import
      if (file) {
        logFileOperation(fileLogs, setFileLogs, 'upload', file, {
          type: 'employee_import',
          status: 'error',
          rowCount: 0,
          validRows: 0,
          errorRows: 0,
          errors: [error.message],
          fileName: file.name
        }, currentUser);
      }
      
      logAudit(auditLogs, setAuditLogs, 'employee_import_failed', 'employee', null, null, null, currentUser, false, error.message);
    }
  };

  // Add vendor manually
  const addVendor = () => {
    // Check permission
    if (!requirePermission(currentUser, 'create', 'vendor')) {
      logAudit(auditLogs, setAuditLogs, 'permission_denied', 'vendor', null, null, { action: 'create' }, currentUser, false, 'Insufficient permissions');
      return;
    }
    
    const { name, bank, ifsc, accountNo } = vendorForm;
    
    if (!name || !bank || !ifsc || !accountNo) {
      setErrors(['Please fill in all required fields (Name, Bank, IFSC, Account)']);
      return;
    }
    
    const vendorId = generateId('VEN');
    const newVendors = { ...masterData.vendors };
    
    newVendors[vendorId] = {
      id: vendorId,
      name: name,
      bank: bank,
      ifsc: ifsc.toUpperCase(),
      accountNo: accountNo,
      branch: vendorForm.branch,
      status: vendorForm.status,
      type: 'vendor',
      addedDate: new Date().toISOString(),
      source: 'manual_entry'
    };
    
    setMasterData({ ...masterData, vendors: newVendors });
    setVendorForm({ name: '', bank: '', ifsc: '', accountNo: '', branch: '', status: 'Active' });
    setShowVendorForm(false);
    setErrors([]);
    
    // Log audit
    logAudit(auditLogs, setAuditLogs, 'vendor_created', 'vendor', vendorId, null, newVendors[vendorId], currentUser);
    
    alert(`✅ Vendor "${name}" added successfully!`);
  };

  // Add employee manually
  const addEmployee = () => {
    // Check permission
    if (!requirePermission(currentUser, 'create', 'employee')) {
      logAudit(auditLogs, setAuditLogs, 'permission_denied', 'employee', null, null, { action: 'create' }, currentUser, false, 'Insufficient permissions');
      return;
    }
    
    const { empId, name, bankName, ifsc, accountNo } = employeeForm;
    
    if (!empId || !name || !bankName || !ifsc || !accountNo) {
      setErrors(['Please fill in all required fields (Emp ID, Name, Bank, IFSC, Account)']);
      return;
    }
    
    if (!empId.startsWith('E')) {
      setErrors(['Emp ID must start with "E" (example: E0001)']);
      return;
    }
    
    if (masterData.employees[empId]) {
      setErrors([`Employee ID ${empId} already exists!`]);
      return;
    }
    
    const newEmployees = { ...masterData.employees };
    
    newEmployees[empId] = {
      empId: empId,
      name: name,
      type: 'employee',
      department: employeeForm.department,
      designation: employeeForm.designation,
      bankName: bankName,
      ifsc: ifsc.toUpperCase(),
      accountNo: accountNo,
      branch: employeeForm.branch,
      accountType: employeeForm.accountType,
      addedDate: new Date().toISOString(),
      source: 'manual_entry'
    };
    
    setMasterData({ ...masterData, employees: newEmployees });
    setEmployeeForm({ empId: '', name: '', department: '', designation: '', bankName: '', ifsc: '', accountNo: '', branch: '', accountType: 'Saving' });
    setShowEmployeeForm(false);
    setErrors([]);
    
    // Log audit
    logAudit(auditLogs, setAuditLogs, 'employee_created', 'employee', empId, null, newEmployees[empId], currentUser);
    
    alert(`✅ Employee "${name}" added successfully!`);
  };

  // AI Receipt Reading
  const processReceiptWithAI = async (file) => {
    setReceiptProcessing(true);
    setErrors([]);
    
    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      
      const mediaType = file.type;
      const isImage = mediaType.startsWith('image/');
      const isPDF = mediaType === 'application/pdf';
      
      if (!isImage && !isPDF) {
        throw new Error('Please upload PDF or image (JPG, PNG)');
      }
      
      const vendorList = Object.values(masterData.vendors).map(v => v.name).join(', ');
      const expenseTypes = Object.keys(CONFIG.expenseTypes).join(', ');
      
      const prompt = `Extract receipt data as JSON only:
Available types: ${expenseTypes}
Known vendors: ${vendorList}

Return ONLY this JSON:
{"date":"DD/MM/YYYY","vendor":"...","amount":0,"billNumber":"...","items":"...","suggestedType":"...","confidence":"high/medium/low"}`;

      const content = [];
      if (isImage) {
        content.push({ type: "image", source: { type: "base64", media_type: mediaType, data: base64Data }});
      } else {
        content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64Data }});
      }
      content.push({ type: "text", text: prompt });

      // Note: AI receipt reading requires Claude API access
      // Since API calls from browser may fail due to CORS, we'll use a fallback
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{ role: "user", content: content }]
          })
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}. AI features require backend proxy.`);
        }

        const data = await response.json();
        let responseText = data.content[0].text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const extractedData = JSON.parse(responseText);
        
        const vendorMatch = findBestMatch(extractedData.vendor, Object.values(masterData.vendors));
        
        setExpenseForm({
          date: parseDateToISO(extractedData.date) || new Date().toISOString().split('T')[0],
          type: extractedData.suggestedType || 'Other',
          payeeType: vendorMatch ? 'vendor' : 'other',
          payeeId: vendorMatch ? vendorMatch.match.id : '',
          payeeName: vendorMatch ? vendorMatch.match.name : extractedData.vendor,
          forSelf: true,
          forEmployeeId: '',
          amount: extractedData.amount.toString(),
          receiptNo: extractedData.billNumber || '',
          narration: extractedData.items || '',
          reason: `AI extracted (${extractedData.confidence})`,
          bankName: vendorMatch ? vendorMatch.match.bank : '',
          ifsc: vendorMatch ? vendorMatch.match.ifsc : '',
          accountNo: vendorMatch ? vendorMatch.match.accountNo : '',
          branch: vendorMatch ? vendorMatch.match.branch : ''
        });
        
        setShowReceiptUpload(false);
        setReceiptProcessing(false);
        alert(`✅ Receipt processed! ${vendorMatch ? `Matched: ${vendorMatch.match.name}` : 'Verify details'}`);
      } catch (apiError) {
        // Fallback: AI not available from browser
        setErrors([
          'AI Receipt Reading requires a backend proxy due to browser CORS restrictions.',
          'Please use manual entry or bulk upload instead.',
          'Contact support to enable AI features: rajesh@oncloudindia.com'
        ]);
        setReceiptProcessing(false);
      }
      
    } catch (error) {
      setErrors([`Error: ${error.message}`]);
      setReceiptProcessing(false);
    }
  };

  const handleReceiptUpload = async (event) => {
    const file = event.target.files[0];
    if (file) await processReceiptWithAI(file);
  };

  // Handle payroll uploads
  const handleMonthlyUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const employees = parseCSVData(text);
      const importCount = importEmployeesFromPayroll(employees);
      setPaymentBatch({...paymentBatch, monthly: employees});
      setErrors([]);
      alert(`✅ Imported ${importCount} employees from monthly payroll`);
    } catch (error) {
      setErrors([`Error: ${error.message}`]);
    }
  };

  const handleWeeklyUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const employees = parseCSVData(text);
      const importCount = importEmployeesFromPayroll(employees);
      setPaymentBatch({...paymentBatch, weekly: employees});
      setErrors([]);
      alert(`✅ Imported ${importCount} employees from weekly payroll`);
    } catch (error) {
      setErrors([`Error: ${error.message}`]);
    }
  };

  // Login Screen
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">{CONFIG.companyName} Payroll</h1>
            <p className="text-gray-600 mt-2">Phase 2.2 - Advanced System</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter username"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={loginForm.showPassword ? "text" : "password"}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setLoginForm({...loginForm, showPassword: !loginForm.showPassword})}
                  className="absolute right-3 top-2.5 text-gray-500"
                >
                  {loginForm.showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{errors[0]}</p>
              </div>
            )}
            
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-semibold"
            >
              Login
            </button>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-xs text-blue-800 mb-2">Default login:</p>
              <p className="text-xs text-blue-700">Username: <strong>admin</strong></p>
              <p className="text-xs text-blue-700">Password: <strong>admin123</strong></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const stats = {
    pendingExpenses: expenses.filter(e => e.status === 'pending').length,
    approvedExpenses: expenses.filter(e => e.status === 'approved').length,
    totalEmployees: Object.keys(masterData.employees).length,
    totalVendors: Object.keys(masterData.vendors).length,
    totalExpenses: expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
  };

  // Main App
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{CONFIG.companyName} Payroll Phase 2.2</h1>
              <p className="text-gray-600 mt-1">Advanced Expense & Payment Management</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Logged in as</p>
                <p className="font-semibold text-gray-800">{currentUser.name}</p>
                <div className="flex items-center gap-2 justify-end mt-1">
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${
                    currentUser.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    currentUser.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {ROLE_NAMES[currentUser.role] || currentUser.role}
                  </span>
                  {currentUser.role !== 'admin' && (
                    <span className="text-xs text-gray-500" title="Read-only access to master data">
                      🔒 Limited
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setCurrentView('home'); setShowBulkUpload(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                currentView === 'home' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Home size={18} />
              Home
            </button>
            <button
              onClick={() => { setCurrentView('expenses'); setShowBulkUpload(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                currentView === 'expenses' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Receipt size={18} />
              Expenses ({stats.pendingExpenses})
            </button>
            <button
              onClick={() => { setCurrentView('masterdata'); setShowBulkUpload(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                currentView === 'masterdata' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Database size={18} />
              Master Data
            </button>
            <button
              onClick={() => { setCurrentView('payroll'); setShowBulkUpload(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                currentView === 'payroll' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <FileText size={18} />
              Payroll
            </button>
            <button
              onClick={() => setCurrentView('files')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                currentView === 'files' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <FileSpreadsheet size={18} />
              Files ({fileLogs.length})
            </button>
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setCurrentView('audit')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  currentView === 'audit' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <List size={18} />
                Audit Log
              </button>
            )}
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setCurrentView('settings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  currentView === 'settings' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Settings size={18} />
                Settings
              </button>
            )}
          </div>
        </div>

        {/* Home View */}
        {currentView === 'home' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Receipt size={32} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.pendingExpenses}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Approved</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.approvedExpenses}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Users size={32} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employees</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalEmployees}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Database size={32} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vendors</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalVendors}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Feature Highlights */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-4">✨ Phase 2.2 Features Active!</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap size={20} />
                    What's New:
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>• 📊 Bulk Excel Upload - Import 100+ expenses</li>
                    <li>• 🧠 Smart Matching - Handles typos & variations</li>
                    <li>• 📥 Download Templates - Pre-filled with your data</li>
                    <li>• 📤 Export Everything - Backup to Excel</li>
                    <li>• ⚡ Fast Validation - Instant duplicate detection</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Quick Actions:</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => downloadExcelTemplate(masterData)}
                      className="w-full bg-white text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition font-semibold text-sm"
                    >
                      📥 Download Expense Template
                    </button>
                    <button
                      onClick={() => downloadMasterDataLists(masterData)}
                      className="w-full bg-white text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition font-semibold text-sm"
                    >
                      📋 Download Master Data Lists
                    </button>
                    <button
                      onClick={() => exportExpenses(expenses)}
                      className="w-full bg-white text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition font-semibold text-sm"
                    >
                      📤 Export All Expenses
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expenses View */}
        {currentView === 'expenses' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Add Expense</h2>
              </div>
              
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
                    <div>
                      <h3 className="font-bold text-red-800 mb-2">Errors</h3>
                      <ul className="list-disc list-inside text-red-700 space-y-1">
                        {errors.map((err, idx) => (<li key={idx}>{err}</li>))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type *</label>
                    <select
                      value={expenseForm.type}
                      onChange={(e) => setExpenseForm({...expenseForm, type: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.keys(CONFIG.expenseTypes).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pay To *</label>
                    <div className="flex gap-2 mb-2">
                      {['vendor', 'employee', 'other'].map(type => (
                        <button
                          key={type}
                          onClick={() => setExpenseForm({...expenseForm, payeeType: type, payeeId: '', payeeName: ''})}
                          className={`px-4 py-2 rounded ${expenseForm.payeeType === type ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                    
                    {expenseForm.payeeType !== 'other' ? (
                      <select
                        value={expenseForm.payeeId}
                        onChange={handlePayeeSelect}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select...</option>
                        {expenseForm.payeeType === 'vendor' && Object.values(masterData.vendors).map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                        {expenseForm.payeeType === 'employee' && Object.values(masterData.employees).map(e => (
                          <option key={e.empId} value={e.empId}>{e.empId} - {e.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={expenseForm.payeeName}
                        onChange={(e) => setExpenseForm({...expenseForm, payeeName: e.target.value})}
                        placeholder="Enter payee name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Amount *</label>
                    <input
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                      placeholder="Enter amount"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {expenseForm.amount && (() => {
                      const validation = validateExpenseAmount(expenseForm.type, expenseForm.amount);
                      return validation.warnings && validation.warnings.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {validation.warnings.map((warning, idx) => (
                            <p key={idx} className="text-xs text-orange-600">⚠️ {warning}</p>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">For</label>
                  <div className="flex items-center gap-4 mb-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={expenseForm.forSelf}
                        onChange={() => setExpenseForm({...expenseForm, forSelf: true, forEmployeeId: ''})}
                      />
                      <span>Myself ({currentUser.name})</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={!expenseForm.forSelf}
                        onChange={() => setExpenseForm({...expenseForm, forSelf: false})}
                      />
                      <span>Someone else</span>
                    </label>
                  </div>
                  {!expenseForm.forSelf && (
                    <select
                      value={expenseForm.forEmployeeId}
                      onChange={(e) => setExpenseForm({...expenseForm, forEmployeeId: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select employee...</option>
                      {Object.values(masterData.employees).map(e => (
                        <option key={e.empId} value={e.empId}>{e.empId} - {e.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Receipt #</label>
                    <input
                      type="text"
                      value={expenseForm.receiptNo}
                      onChange={(e) => setExpenseForm({...expenseForm, receiptNo: e.target.value})}
                      placeholder="Bill/Invoice number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                    <input
                      type="text"
                      value={expenseForm.reason}
                      onChange={(e) => setExpenseForm({...expenseForm, reason: e.target.value})}
                      placeholder="Purpose"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Narration</label>
                  <textarea
                    value={expenseForm.narration}
                    onChange={(e) => setExpenseForm({...expenseForm, narration: e.target.value})}
                    placeholder="Details"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {expenseForm.payeeId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-green-800 mb-2">✅ Auto-filled:</p>
                    <div className="grid md:grid-cols-2 gap-2 text-sm text-green-700">
                      <p>Bank: {expenseForm.bankName}</p>
                      <p>IFSC: {expenseForm.ifsc}</p>
                      <p>Account: {expenseForm.accountNo}</p>
                      <p>Branch: {expenseForm.branch}</p>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={addExpense}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-semibold"
                >
                  Add to Queue
                </button>
              </div>
            </div>
            
            {/* Pending Expenses */}
            {expenses.filter(e => e.status === 'pending').length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">Pending Expenses ({expenses.filter(e => e.status === 'pending').length})</h3>
                <div className="space-y-3">
                  {expenses.filter(e => e.status === 'pending').map(exp => (
                    <div key={exp.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{exp.type}</span>
                            {exp.warnings && exp.warnings.length > 0 && (
                              <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">
                                ⚠️ {exp.warnings.length} warning(s)
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">
                            {exp.date} | {exp.payeeName} | ₹{parseFloat(exp.amount).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Dr: {exp.drAccount} | Cr: {exp.crAccount}
                          </p>
                          {exp.reason && <p className="text-xs text-gray-600">Reason: {exp.reason}</p>}
                        </div>
                        {hasPermission(currentUser, 'approve', 'expense') && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveExpense(exp.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => rejectExpense(exp.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              ✗
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Bulk Upload Section - Right Here in Expenses Tab! */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-lg p-6 border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <FileSpreadsheet size={32} className="text-purple-600" />
                <div>
                  <h3 className="text-2xl font-bold text-purple-900">💡 Have Many Expenses?</h3>
                  <p className="text-purple-700">Use Bulk Upload - Import 10-100 expenses at once!</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => downloadExpenseTemplate(masterData)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    <Download size={20} />
                    Download Template
                  </button>
                </div>
                
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">📋 How to use:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 ml-4">
                    <li>1. Download template → See instructions inside</li>
                    <li>2. Fill first 5 columns only</li>
                    <li>3. Scroll right to see vendor & type lists</li>
                    <li>4. Copy names from lists → Paste in rows</li>
                    <li>5. Upload below</li>
                  </ol>
                </div>
                
                <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center bg-white">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleBulkUpload}
                    className="hidden"
                    id="bulk-expense-upload"
                  />
                  <label
                    htmlFor="bulk-expense-upload"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 cursor-pointer transition font-semibold text-lg"
                  >
                    <Upload size={24} />
                    Upload Expense CSV
                  </label>
                </div>
                
                {bulkUploadResults && (
                  <div className="space-y-4">
                    <div className="bg-white border border-blue-200 rounded-lg p-4">
                      <h4 className="font-bold text-blue-900 mb-2">Validation Results</h4>
                      <div className="grid md:grid-cols-3 gap-2 text-sm">
                        <div><p>Total: <strong>{bulkUploadResults.total}</strong></p></div>
                        <div><p className="text-green-700">Valid: <strong>{bulkUploadResults.valid.length}</strong></p></div>
                        <div><p className="text-orange-700">Warnings: <strong>{bulkUploadResults.warnings.length}</strong></p></div>
                      </div>
                    </div>
                    
                    {(bulkUploadResults.valid.length > 0 || bulkUploadResults.warnings.length > 0) && (
                      <button
                        onClick={importBulkExpenses}
                        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold"
                      >
                        Import {bulkUploadResults.valid.length + bulkUploadResults.warnings.length} Expenses
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Master Data View */}
        {currentView === 'masterdata' && (
          <div className="space-y-6">
            {/* Employees Section with Bulk Import */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Employees ({Object.keys(masterData.employees).length})</h2>
                <div className="flex gap-2">
                  {hasPermission(currentUser, 'create', 'employee') && (
                    <button
                      onClick={() => setShowEmployeeForm(!showEmployeeForm)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      <Plus size={18} />
                      Add Employee
                    </button>
                  )}
                  <button
                    onClick={() => downloadEmployeeTemplate()}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Download size={18} />
                    Template
                  </button>
                  {hasPermission(currentUser, 'create', 'employee') && (
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                      <Upload size={18} />
                      Import
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleEmployeeImport}
                        className="hidden"
                      />
                    </label>
                  )}
                  <button
                    onClick={() => exportMasterData(masterData)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    <Download size={18} />
                    Export
                  </button>
                </div>
              </div>
              
              {/* Manual Add Employee Form */}
              {showEmployeeForm && (
                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6 mb-4">
                  <h3 className="text-lg font-bold text-purple-900 mb-4">Add New Employee</h3>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Emp ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={employeeForm.empId}
                          onChange={(e) => setEmployeeForm({...employeeForm, empId: e.target.value.toUpperCase()})}
                          placeholder="E0001"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={employeeForm.name}
                          onChange={(e) => setEmployeeForm({...employeeForm, name: e.target.value})}
                          placeholder="Enter employee name"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                        <input
                          type="text"
                          value={employeeForm.department}
                          onChange={(e) => setEmployeeForm({...employeeForm, department: e.target.value})}
                          placeholder="Department"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
                        <input
                          type="text"
                          value={employeeForm.designation}
                          onChange={(e) => setEmployeeForm({...employeeForm, designation: e.target.value})}
                          placeholder="Designation"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Bank Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={employeeForm.bankName}
                          onChange={(e) => setEmployeeForm({...employeeForm, bankName: e.target.value})}
                          placeholder="Bank name"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          IFSC Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={employeeForm.ifsc}
                          onChange={(e) => setEmployeeForm({...employeeForm, ifsc: e.target.value.toUpperCase()})}
                          placeholder="IFSC (11 chars)"
                          maxLength="11"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Account Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={employeeForm.accountNo}
                          onChange={(e) => setEmployeeForm({...employeeForm, accountNo: e.target.value})}
                          placeholder="Account number"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
                        <input
                          type="text"
                          value={employeeForm.branch}
                          onChange={(e) => setEmployeeForm({...employeeForm, branch: e.target.value})}
                          placeholder="Branch name"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <button
                        onClick={addEmployee}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                      >
                        ✓ Save Employee
                      </button>
                      <button
                        onClick={() => {
                          setShowEmployeeForm(false);
                          setEmployeeForm({ empId: '', name: '', department: '', designation: '', bankName: '', ifsc: '', accountNo: '', branch: '', accountType: 'Saving' });
                        }}
                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {!hasPermission(currentUser, 'create', 'employee') && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
                  ℹ️ <strong>Read-Only Access:</strong> You can view employees but only administrators can add or edit them.
                </div>
              )}
              
              {hasPermission(currentUser, 'create', 'employee') && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
                  💡 <strong>Single:</strong> Click "Add Employee" → Fill form → Save | <strong>Bulk:</strong> Click "Template" → Fill CSV → Click "Import" | <strong>Or:</strong> Import from Payroll tab
                </div>
              )}
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.values(masterData.employees).map(emp => (
                  <div key={emp.empId} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="font-semibold">{emp.empId} - {emp.name}</p>
                    <p className="text-sm text-gray-600">{emp.department} | {emp.designation}</p>
                    <p className="text-xs text-gray-500">{emp.bankName} - {emp.ifsc} - {emp.accountNo}</p>
                  </div>
                ))}
                {Object.keys(masterData.employees).length === 0 && (
                  <p className="text-gray-500 text-center py-8">No employees. Add manually, import CSV, or upload payroll.</p>
                )}
              </div>
            </div>
            
            {/* Vendors Section with Bulk Import */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Vendors ({Object.keys(masterData.vendors).length})</h2>
                <div className="flex gap-2">
                  {hasPermission(currentUser, 'create', 'vendor') && (
                    <button
                      onClick={() => setShowVendorForm(!showVendorForm)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      <Plus size={18} />
                      Add Vendor
                    </button>
                  )}
                  <button
                    onClick={() => downloadVendorTemplate()}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Download size={18} />
                    Template
                  </button>
                  {hasPermission(currentUser, 'create', 'vendor') && (
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                      <Upload size={18} />
                      Import
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleVendorImport}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
              
              {/* Manual Add Vendor Form */}
              {showVendorForm && (
                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6 mb-4">
                  <h3 className="text-lg font-bold text-purple-900 mb-4">Add New Vendor</h3>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Vendor Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={vendorForm.name}
                          onChange={(e) => setVendorForm({...vendorForm, name: e.target.value})}
                          placeholder="Enter vendor name"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Bank Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={vendorForm.bank}
                          onChange={(e) => setVendorForm({...vendorForm, bank: e.target.value})}
                          placeholder="Enter bank name"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          IFSC Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={vendorForm.ifsc}
                          onChange={(e) => setVendorForm({...vendorForm, ifsc: e.target.value.toUpperCase()})}
                          placeholder="IFSC (11 chars)"
                          maxLength="11"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Account Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={vendorForm.accountNo}
                          onChange={(e) => setVendorForm({...vendorForm, accountNo: e.target.value})}
                          placeholder="Account number"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Branch
                        </label>
                        <input
                          type="text"
                          value={vendorForm.branch}
                          onChange={(e) => setVendorForm({...vendorForm, branch: e.target.value})}
                          placeholder="Branch name"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <button
                        onClick={addVendor}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                      >
                        ✓ Save Vendor
                      </button>
                      <button
                        onClick={() => {
                          setShowVendorForm(false);
                          setVendorForm({ name: '', bank: '', ifsc: '', accountNo: '', branch: '', status: 'Active' });
                        }}
                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {!hasPermission(currentUser, 'create', 'vendor') && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
                  ℹ️ <strong>Read-Only Access:</strong> You can view vendors but only administrators can add or edit them.
                </div>
              )}
              
              {hasPermission(currentUser, 'create', 'vendor') && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
                  💡 <strong>Single:</strong> Click "Add Vendor" → Fill form → Save | <strong>Bulk:</strong> Click "Template" → Fill CSV → Click "Import"
                </div>
              )}
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.values(masterData.vendors).map(vendor => (
                  <div key={vendor.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold">{vendor.name}</p>
                        <p className="text-xs text-gray-500">{vendor.bank} - {vendor.ifsc} - {vendor.accountNo}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded h-fit ${
                        vendor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                      }`}>
                        {vendor.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Payroll View */}
        {currentView === 'payroll' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Import Monthly Payroll</h2>
              <p className="text-gray-600 mb-4">Automatically imports employees to master data</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleMonthlyUpload}
                  className="hidden"
                  id="monthly-upload"
                />
                <label
                  htmlFor="monthly-upload"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  <Upload size={20} />
                  Upload Monthly CSV
                </label>
              </div>
              {paymentBatch.monthly && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-semibold text-green-800">✅ Loaded: {paymentBatch.monthly.length} rows</p>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Import Weekly Payroll</h2>
              <p className="text-gray-600 mb-4">Automatically imports employees to master data</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleWeeklyUpload}
                  className="hidden"
                  id="weekly-upload"
                />
                <label
                  htmlFor="weekly-upload"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
                >
                  <Upload size={20} />
                  Upload Weekly CSV
                </label>
              </div>
              {paymentBatch.weekly && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-semibold text-green-800">✅ Loaded: {paymentBatch.weekly.length} rows</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Files View */}
        {currentView === 'files' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">File Management</h2>
                  <p className="text-gray-600">Track all file uploads and downloads</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>{fileLogs.length}</strong> files tracked</p>
                </div>
              </div>
              
              {fileLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>No files uploaded yet</p>
                  <p className="text-sm">Upload expense CSV, vendor import, or employee import to see them here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fileLogs.slice(0, 50).map(log => (
                    <div key={log.fileId} className={`border-2 rounded-lg p-4 ${
                      log.status === 'processed' || log.status === 'success' ? 'border-green-200 bg-green-50' :
                      log.status === 'error' ? 'border-red-200 bg-red-50' :
                      'border-orange-200 bg-orange-50'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText size={20} className={
                              log.status === 'processed' || log.status === 'success' ? 'text-green-600' :
                              log.status === 'error' ? 'text-red-600' : 'text-orange-600'
                            } />
                            <span className="font-semibold text-gray-900">{log.fileName}</span>
                            <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">
                              {log.action.toUpperCase()}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              log.status === 'processed' || log.status === 'success' ? 'bg-green-200 text-green-800' :
                              log.status === 'error' ? 'bg-red-200 text-red-800' :
                              'bg-orange-200 text-orange-800'
                            }`}>
                              {log.status.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="grid md:grid-cols-4 gap-4 text-sm text-gray-700">
                            <div>
                              <p className="text-xs text-gray-500">Uploaded By</p>
                              <p className="font-medium">{log.uploadedByName}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Date</p>
                              <p className="font-medium">{formatRelativeTime(log.uploadedDate)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Rows</p>
                              <p className="font-medium">{log.rowCount} total | {log.validRows} valid | {log.errorRows} errors</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Size</p>
                              <p className="font-medium">{formatFileSize(log.fileSize)}</p>
                            </div>
                          </div>
                          
                          {log.errors && log.errors.length > 0 && (
                            <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded text-sm">
                              <p className="font-semibold text-red-800 mb-1">Errors:</p>
                              <ul className="list-disc list-inside text-red-700 space-y-1">
                                {log.errors.slice(0, 3).map((err, idx) => (
                                  <li key={idx}>{err}</li>
                                ))}
                                {log.errors.length > 3 && (
                                  <li className="text-red-600">...and {log.errors.length - 3} more</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {fileLogs.length > 50 && (
                    <p className="text-center text-sm text-gray-500 pt-4">
                      Showing 50 most recent files (total: {fileLogs.length})
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audit Log View - Admin Only */}
        {currentView === 'audit' && (
          <div className="space-y-6">
            {currentUser.role !== 'admin' ? (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h3>
                <p className="text-gray-600">Only administrators can view audit logs.</p>
                <button
                  onClick={() => setCurrentView('home')}
                  className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go to Home
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Audit Log</h2>
                    <p className="text-gray-600">Complete history of all actions in the system</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-sm text-gray-600 text-right">
                      <p><strong>{auditLogs.length}</strong> events tracked</p>
                      <p className="text-xs">{auditLogs.filter(l => !l.success).length} failures</p>
                    </div>
                    <button
                      onClick={() => exportAuditLogs(auditLogs)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Download size={18} />
                      Export CSV
                    </button>
                  </div>
                </div>
                
                {auditLogs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Database size={48} className="mx-auto mb-4 text-gray-400" />
                    <p>No audit events yet</p>
                    <p className="text-sm">Actions will be logged automatically</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {auditLogs.slice(0, 100).map(log => (
                      <div key={log.logId} className={`border-l-4 rounded-r-lg p-4 ${
                        !log.success ? 'border-red-500 bg-red-50' :
                        log.category === 'auth' ? 'border-purple-500 bg-purple-50' :
                        log.category === 'approval' ? 'border-green-500 bg-green-50' :
                        log.category === 'file' ? 'border-blue-500 bg-blue-50' :
                        'border-gray-500 bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">{getCategoryIcon(log.category)}</span>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {log.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </p>
                                <p className="text-sm text-gray-600">
                                  by <strong>{log.userName}</strong> ({log.userRole})
                                </p>
                              </div>
                              {!log.success && (
                                <span className="text-xs px-2 py-1 rounded bg-red-200 text-red-800">
                                  FAILED
                                </span>
                              )}
                            </div>
                            
                            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700 mb-2">
                              <div>
                                <p className="text-xs text-gray-500">Time</p>
                                <p className="font-medium">{formatRelativeTime(log.timestamp)}</p>
                                <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Resource</p>
                                <p className="font-medium">{log.resource} {log.resourceId && `(${log.resourceId})`}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Category</p>
                                <p className="font-medium capitalize">{log.category}</p>
                              </div>
                            </div>
                            
                            {log.changes && log.changes.length > 0 && (
                              <div className="mt-2 p-2 bg-white border border-gray-200 rounded text-xs">
                                <p className="font-semibold text-gray-700 mb-1">Changes:</p>
                                <ul className="space-y-1 text-gray-600">
                                  {log.changes.slice(0, 3).map((change, idx) => (
                                    <li key={idx}>• {change}</li>
                                  ))}
                                  {log.changes.length > 3 && (
                                    <li className="text-gray-500">...and {log.changes.length - 3} more changes</li>
                                  )}
                                </ul>
                              </div>
                            )}
                            
                            {log.errorMessage && (
                              <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm">
                                <p className="font-semibold text-red-800">Error: {log.errorMessage}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {auditLogs.length > 100 && (
                      <p className="text-center text-sm text-gray-500 pt-4">
                        Showing 100 most recent events (total: {auditLogs.length})
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Settings View - Admin Only */}
        {currentView === 'settings' && (
          <div className="space-y-6">
            {currentUser.role !== 'admin' ? (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h3>
                <p className="text-gray-600">Only administrators can access settings.</p>
                <button
                  onClick={() => setCurrentView('home')}
                  className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go to Home
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* System Information */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-bold mb-6">System Information</h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-600 mb-1">Total Users</p>
                      <p className="text-3xl font-bold text-blue-900">{Object.keys(masterData.users).length}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-600 mb-1">Audit Events</p>
                      <p className="text-3xl font-bold text-green-900">{auditLogs.length}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-sm text-purple-600 mb-1">Files Tracked</p>
                      <p className="text-3xl font-bold text-purple-900">{fileLogs.length}</p>
                    </div>
                  </div>
                </div>

                {/* Role & Permissions Reference */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-bold mb-6">Roles & Permissions</h2>
                  <div className="space-y-4">
                    {/* Admin Role */}
                    <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-purple-600 text-white rounded-lg font-semibold">
                          Administrator
                        </span>
                        <span className="text-sm text-purple-700">Full System Access</span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-2 text-sm text-purple-800">
                        <div>✅ Add/Edit Vendors</div>
                        <div>✅ Add/Edit Employees</div>
                        <div>✅ Add/Approve Expenses</div>
                        <div>✅ View Audit Logs</div>
                        <div>✅ Manage Users</div>
                        <div>✅ Upload Files</div>
                        <div>✅ Export All Data</div>
                        <div>✅ Access Settings</div>
                      </div>
                    </div>

                    {/* Manager Role */}
                    <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-blue-600 text-white rounded-lg font-semibold">
                          Manager
                        </span>
                        <span className="text-sm text-blue-700">Expense Management Access</span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-2 text-sm text-blue-800">
                        <div>✅ Add Expenses</div>
                        <div>✅ Approve/Reject Expenses</div>
                        <div>✅ View Master Data (Read-Only)</div>
                        <div>✅ Upload Files</div>
                        <div>✅ View Own Activity</div>
                        <div>❌ Cannot Edit Master Data</div>
                        <div>❌ Cannot View Full Audit Log</div>
                        <div>❌ Cannot Access Settings</div>
                      </div>
                    </div>

                    {/* User Role */}
                    <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-gray-600 text-white rounded-lg font-semibold">
                          User
                        </span>
                        <span className="text-sm text-gray-700">Basic Access</span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-800">
                        <div>✅ Add Expenses</div>
                        <div>✅ View Own Expenses</div>
                        <div>✅ View Master Data (Read-Only)</div>
                        <div>✅ Download Templates</div>
                        <div>❌ Cannot Approve Expenses</div>
                        <div>❌ Cannot Edit Master Data</div>
                        <div>❌ Cannot View Audit Logs</div>
                        <div>❌ Cannot Access Settings</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Users */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-bold mb-6">Current Users</h2>
                  <div className="space-y-3">
                    {Object.values(masterData.users).map(user => (
                      <div key={user.username} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                            user.role === 'admin' ? 'bg-purple-600' :
                            user.role === 'manager' ? 'bg-blue-600' :
                            'bg-gray-600'
                          }`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-600">@{user.username}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-lg font-semibold text-sm ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ROLE_NAMES[user.role] || user.role}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> To add more users or change roles, update the <code className="bg-blue-100 px-2 py-1 rounded">config/constants.js</code> file.
                    </p>
                  </div>
                </div>

                {/* Data Summary */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-bold mb-6">Data Summary</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Vendors</p>
                      <p className="text-2xl font-bold text-gray-900">{Object.keys(masterData.vendors).length}</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Employees</p>
                      <p className="text-2xl font-bold text-gray-900">{Object.keys(masterData.employees).length}</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                      <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Pending Expenses</p>
                      <p className="text-2xl font-bold text-gray-900">{expenses.filter(e => e.status === 'pending').length}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>On Cloud Payroll Phase 2.2 | All data stored locally in browser</p>
        </div>
      </div>
    </div>
  );
}

export default App;
