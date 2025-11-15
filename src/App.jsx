import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Home, DollarSign, Users, AlertCircle, CheckCircle, Trash2, Plus, List, LogOut, User, Settings, Database, Receipt, FileSpreadsheet, Eye, EyeOff, Camera, Zap } from 'lucide-react';

// Import utilities
import { findBestMatch, getConfidenceLabel, needsConfirmation } from './utils/fuzzyMatching';
import { validateExpenseAmount, checkDuplicateExpense, validateBulkRow, formatDate, parseDateToISO } from './utils/validation';
import { downloadExpenseTemplate, downloadVendorTemplate, downloadEmployeeTemplate, downloadMasterDataLists, exportExpenses, exportMasterData, parseCSVData, generateId, generateJournalNumber } from './utils/exportUtils';
import { saveToStorage, loadFromStorage } from './utils/storage';
import { CONFIG, INITIAL_VENDORS, DEFAULT_USER } from './config/constants';

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
      saveToStorage({ masterData: initialData, expenses: [] });
    }
  }, []);

  // Auto-save when data changes
  useEffect(() => {
    if (currentUser) {
      saveToStorage({ masterData, expenses });
    }
  }, [masterData, expenses, currentUser]);

  // Login handler
  const handleLogin = () => {
    const { username, password } = loginForm;
    const user = masterData.users[username];
    
    if (user && user.password === password) {
      setCurrentUser(user);
      setShowLogin(false);
      setLoginForm({ username: '', password: '', showPassword: false });
      setErrors([]);
    } else {
      setErrors(['Invalid username or password']);
    }
  };

  // Logout handler
  const handleLogout = () => {
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
      
    } catch (error) {
      setErrors([`Error reading file: ${error.message}`]);
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
      
    } catch (error) {
      setErrors([`Error importing vendors: ${error.message}`]);
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
      
    } catch (error) {
      setErrors([`Error importing employees: ${error.message}`]);
    }
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
                <p className="text-xs text-gray-500">{currentUser.role}</p>
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
                        {currentUser.role === 'admin' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setExpenses(expenses.map(e => 
                                e.id === exp.id ? {...e, status: 'approved', approvedBy: currentUser.username, approvedDate: new Date().toISOString()} : e
                              ))}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setExpenses(expenses.map(e => 
                                e.id === exp.id ? {...e, status: 'rejected', rejectedBy: currentUser.username} : e
                              ))}
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
                  <button
                    onClick={() => downloadEmployeeTemplate()}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Download size={18} />
                    Template
                  </button>
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
                  <button
                    onClick={() => exportMasterData(masterData)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    <Download size={18} />
                    Export
                  </button>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
                💡 <strong>Bulk Import:</strong> Click "Template" → Fill employee details → Click "Import" → Upload CSV
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.values(masterData.employees).map(emp => (
                  <div key={emp.empId} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="font-semibold">{emp.empId} - {emp.name}</p>
                    <p className="text-sm text-gray-600">{emp.department} | {emp.designation}</p>
                    <p className="text-xs text-gray-500">{emp.bankName} - {emp.ifsc} - {emp.accountNo}</p>
                  </div>
                ))}
                {Object.keys(masterData.employees).length === 0 && (
                  <p className="text-gray-500 text-center py-8">No employees. Import payroll or use bulk import above.</p>
                )}
              </div>
            </div>
            
            {/* Vendors Section with Bulk Import */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Vendors ({Object.keys(masterData.vendors).length})</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadVendorTemplate()}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Download size={18} />
                    Template
                  </button>
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
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
                💡 <strong>Bulk Import:</strong> Click "Template" → Fill vendor details → Click "Import" → Upload CSV
              </div>
              
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

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>On Cloud Payroll Phase 2.2 | All data stored locally in browser</p>
        </div>
      </div>
    </div>
  );
}

export default App;
