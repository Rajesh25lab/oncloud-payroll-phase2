import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Home, DollarSign, Users, AlertCircle, CheckCircle, Trash2, Plus, List, LogOut, User, Settings, Database, Receipt, FileSpreadsheet, UserPlus, Eye, EyeOff } from 'lucide-react';

// Initial vendor data from Rajesh's list
const INITIAL_VENDORS = [
  { id: 'V001', name: 'ALPINE', accountNo: '1246261006174', ifsc: 'CNRB0002344', bank: 'Canara Bank', branch: 'karur', status: 'Active' },
  { id: 'V002', name: 'AMMAN TRADERS', accountNo: '4037201000436', ifsc: 'CNRB0004037', bank: 'Canara Bank', branch: 'TIRUPPUR', status: 'Active' },
  { id: 'V003', name: 'AMMAN TRADERS', accountNo: '9613576100', ifsc: 'KKBK0008785', bank: 'Kotak Mahindra Bank', branch: '', status: 'Active' },
  { id: 'V004', name: 'VARSHA COTTON MILLS ARISTOCRATIC ENTERPRISES', accountNo: '338073000001927', ifsc: 'SIBL0000338', bank: 'South Indian Bank', branch: '', status: 'Active' },
  { id: 'V005', name: 'ASM TEXTILES', accountNo: '1195102000007092', ifsc: 'IBKL0001195', bank: 'IDBI Bank', branch: '', status: 'Active' },
  { id: 'V006', name: 'BABBALTEXO FAB', accountNo: '918030091703751', ifsc: 'UTIB0003503', bank: 'Axis Bank', branch: '', status: 'Active' },
  { id: 'V007', name: 'BHAIRAAV WATER SYSTEMS', accountNo: '5949544882', ifsc: 'KKBK0000492', bank: 'Kotak Mahindra Bank', branch: '', status: 'Active' },
  { id: 'V008', name: 'CHIRAG ENTERPRISE', accountNo: '08472020000490', ifsc: 'HDFC0000847', bank: 'HDFC Bank', branch: '', status: 'Active' },
  { id: 'V009', name: 'COSMIC COMPUTER', accountNo: '0113102000100649', ifsc: 'IBKL0000113', bank: 'IDBI Bank', branch: '', status: 'Active' },
  { id: 'V010', name: 'DIGIWHITE FABRICS LLP', accountNo: '8000666444', ifsc: 'KKBK0002867', bank: 'Kotak Mahindra Bank', branch: '', status: 'Active' },
  { id: 'V011', name: 'EAGLE PRINT CARE', accountNo: '0393102000008297', ifsc: 'IBKL0000393', bank: 'IDBI Bank', branch: '', status: 'Active' },
  { id: 'V012', name: 'FRIENDS PACK', accountNo: '50200014924572', ifsc: 'HDFC0002408', bank: 'HDFC Bank', branch: '', status: 'Active' },
  { id: 'V013', name: 'GINNI SPECTRA', accountNo: '675405500011', ifsc: 'ICIC0006754', bank: 'ICICI Bank', branch: '', status: 'Active' }
];

// Configuration
const CONFIG = {
  ledgers: {
    bank: "Kotak Mahindra Bank",
    salary: "Salary A/c",
    wages: "Wages",
    otherEarnings: "Other Earnings",
    overtime: "Overtime",
    esi: "ESI Payable",
    loan: "Staff Loan & Advance",
    extraPay: "Extra Pay",
    penalties: "Penalties",
    tdsSalary: "TDS Payable - Salary"
  },
  narrations: {
    monthly: "Monthly payroll",
    weekly: "Weekly payroll",
    manual: "Manual Entry",
    expense: "Expense Payment"
  },
  companyAccount: "4647261831",
  companyName: "On Cloud",
  supportEmail: "rajesh@oncloudindia.com",
  
  // Expense types with Dr accounts and validation ranges
  expenseTypes: {
    "Rent": { 
      dr: "Factory Rent A/c @GST", 
      tds: "TDS 10%", 
      rate: 0.1,
      minAmount: 100000,
      maxAmount: 150000,
      category: "Fixed Expense"
    },
    "Interest": { 
      dr: "Loan Interest A/c", 
      tds: "Tds on Interest", 
      rate: 0.1,
      minAmount: 10000,
      maxAmount: 90000,
      category: "Financial"
    },
    "Petrol": { 
      dr: "Petrol A/c", 
      tds: null, 
      rate: 0,
      minAmount: 1,
      maxAmount: 3000,
      category: "Operating Expense"
    },
    "Advance": { 
      dr: "Staff Advance A/c", 
      tds: null, 
      rate: 0,
      minAmount: 500,
      maxAmount: 50000,
      category: "Staff Advance"
    },
    "Loan": { 
      dr: "Staff Loan A/c", 
      tds: null, 
      rate: 0,
      minAmount: 1000,
      maxAmount: 100000,
      category: "Staff Loan"
    },
    "Salary": { 
      dr: "Salary A/c", 
      tds: null, 
      rate: 0,
      minAmount: 1000,
      maxAmount: 100000,
      category: "Payroll"
    },
    "Wages": { 
      dr: "Wages A/c", 
      tds: null, 
      rate: 0,
      minAmount: 500,
      maxAmount: 50000,
      category: "Payroll"
    },
    "Overtime": { 
      dr: "Overtime A/c", 
      tds: null, 
      rate: 0,
      minAmount: 100,
      maxAmount: 10000,
      category: "Payroll"
    },
    "Cutting Charges": { 
      dr: "Cutting Charges A/c", 
      tds: "TDS 1%", 
      rate: 0.01,
      minAmount: 1000,
      maxAmount: 100000,
      category: "Production"
    },
    "Stitching Charges": { 
      dr: "Stitching Charges A/c", 
      tds: "TDS 1%", 
      rate: 0.01,
      minAmount: 1000,
      maxAmount: 100000,
      category: "Production"
    },
    "Cartage": { 
      dr: "Cartage A/c", 
      tds: "TDS 1%", 
      rate: 0.01,
      minAmount: 500,
      maxAmount: 50000,
      category: "Logistics"
    },
    "Professional Fees": { 
      dr: "Professional Fees A/c", 
      tds: "TDS 10%", 
      rate: 0.1,
      minAmount: 5000,
      maxAmount: 200000,
      category: "Professional Services"
    },
    "Other": { 
      dr: "Miscellaneous Expenses A/c", 
      tds: null, 
      rate: 0,
      minAmount: 0,
      maxAmount: 5000,
      category: "Miscellaneous",
      alertThreshold: 5000
    }
  }
};

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
    payeeType: 'vendor', // 'vendor', 'employee', 'other'
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
  
  const [paymentBatch, setPaymentBatch] = useState({
    monthly: null,
    weekly: null,
    expenses: []
  });
  
  const [errors, setErrors] = useState([]);

  // Initialize app - load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('oncloud_phase2_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setMasterData(data.masterData || { employees: {}, vendors: {}, users: {} });
        setExpenses(data.expenses || []);
      } catch (e) {
        console.error('Error loading data:', e);
      }
    } else {
      // Initialize with default vendors and admin user
      const initialData = {
        employees: {},
        vendors: {},
        users: {
          'admin': {
            username: 'admin',
            password: 'admin123', // In production, this should be hashed!
            name: 'Rajesh',
            empId: 'ADMIN',
            role: 'admin',
            email: 'rajesh@oncloudindia.com'
          }
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
      saveData({ masterData: initialData, expenses: [] });
    }
  }, []);

  // Save to localStorage
  const saveData = (data) => {
    localStorage.setItem('oncloud_phase2_data', JSON.stringify(data));
  };

  // Auto-save when data changes
  useEffect(() => {
    if (currentUser) {
      saveData({ masterData, expenses });
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

  // Format date as DD/MM/YYYY
  const formatDate = (date = new Date()) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  // Generate unique IDs
  const generateId = (prefix) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}-${timestamp}-${random}`;
  };

  // Import employees from payroll CSV
  const importEmployeesFromPayroll = (employees) => {
    const newEmployees = { ...masterData.employees };
    let importCount = 0;
    
    employees.forEach(emp => {
      const empId = emp['Emp ID'];
      if (empId && empId.startsWith('E')) {
        // Only import if new or updated
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

  // Validate expense amount
  const validateExpenseAmount = (type, amount) => {
    const config = CONFIG.expenseTypes[type];
    if (!config) return { valid: true };
    
    const amt = parseFloat(amount);
    const warnings = [];
    
    if (config.minAmount && amt < config.minAmount) {
      warnings.push(`Amount below normal range (min: ₹${config.minAmount.toLocaleString()})`);
    }
    
    if (config.maxAmount && amt > config.maxAmount) {
      warnings.push(`Amount above normal range (max: ₹${config.maxAmount.toLocaleString()})`);
    }
    
    if (config.alertThreshold && amt > config.alertThreshold) {
      warnings.push(`Amount exceeds alert threshold (₹${config.alertThreshold.toLocaleString()})`);
    }
    
    return {
      valid: warnings.length === 0,
      warnings: warnings
    };
  };

  // Check for duplicate expenses
  const checkDuplicateExpense = (newExpense) => {
    const duplicates = expenses.filter(exp => {
      const sameDate = exp.date === newExpense.date;
      const sameType = exp.type === newExpense.type;
      const sameAmount = Math.abs(parseFloat(exp.amount) - parseFloat(newExpense.amount)) < 0.01;
      const samePayee = exp.payeeName === newExpense.payeeName;
      
      return sameDate && sameType && sameAmount && samePayee && exp.status !== 'rejected';
    });
    
    return duplicates.length > 0 ? duplicates : null;
  };

  // Add expense
  const addExpense = () => {
    const validation = validateExpenseAmount(expenseForm.type, expenseForm.amount);
    const duplicates = checkDuplicateExpense(expenseForm);
    
    const warnings = [...(validation.warnings || [])];
    if (duplicates) {
      warnings.push(`Possible duplicate: Similar expense found on ${duplicates[0].date}`);
    }
    
    if (!expenseForm.amount || !expenseForm.payeeName) {
      setErrors(['Please fill in amount and payee name']);
      return;
    }
    
    // Get Cr account (who the money goes to/who paid)
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

  // Parse CSV data
  const parseExcelData = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('File appears to be empty or invalid');
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx]?.trim() || '';
      });
      data.push(row);
    }
    
    return data;
  };

  // Handle monthly payroll upload
  const handleMonthlyUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const employees = parseExcelData(text);
      
      // Import employees to master data
      const importCount = importEmployeesFromPayroll(employees);
      
      setPaymentBatch({...paymentBatch, monthly: employees});
      setErrors([]);
      alert(`✅ Imported ${importCount} employees to master data`);
    } catch (error) {
      setErrors([`Error reading monthly file: ${error.message}`]);
    }
  };

  // If not logged in, show login screen
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">{CONFIG.companyName} Payroll</h1>
            <p className="text-gray-600 mt-2">Phase 2 - Advanced System</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
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

  // Main app - logged in
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{CONFIG.companyName} Payroll Phase 2</h1>
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
              onClick={() => setCurrentView('home')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                currentView === 'home' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Home size={18} />
              Home
            </button>
            <button
              onClick={() => setCurrentView('expenses')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                currentView === 'expenses' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Receipt size={18} />
              Expenses ({expenses.filter(e => e.status === 'pending').length})
            </button>
            <button
              onClick={() => setCurrentView('masterdata')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                currentView === 'masterdata' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Database size={18} />
              Master Data
            </button>
            <button
              onClick={() => setCurrentView('payroll')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                currentView === 'payroll' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <FileText size={18} />
              Payroll
            </button>
          </div>
        </div>

        {/* Content Based on View */}
        {currentView === 'home' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Receipt size={32} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pending Expenses</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {expenses.filter(e => e.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Users size={32} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employees</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {Object.keys(masterData.employees).length}
                    </p>
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
                    <p className="text-3xl font-bold text-gray-800">
                      {Object.keys(masterData.vendors).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-4">✨ Phase 2 Features Active!</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">✅ What's New:</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Multi-user login system</li>
                    <li>• Master data management</li>
                    <li>• Smart expense validation</li>
                    <li>• Duplicate detection</li>
                    <li>• Auto-fill from master data</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">🚀 Coming Soon:</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• AI receipt reading (PDF/JPEG)</li>
                    <li>• Bulk Excel upload</li>
                    <li>• Approval workflow</li>
                    <li>• Reports & analytics</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expense View - Continues in next part due to length... */}
        {currentView === 'expenses' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Add New Expense</h2>
            
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expense Type</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pay To</label>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setExpenseForm({...expenseForm, payeeType: 'vendor', payeeId: '', payeeName: ''})}
                      className={`px-4 py-2 rounded ${expenseForm.payeeType === 'vendor' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                      Vendor
                    </button>
                    <button
                      onClick={() => setExpenseForm({...expenseForm, payeeType: 'employee', payeeId: '', payeeName: ''})}
                      className={`px-4 py-2 rounded ${expenseForm.payeeType === 'employee' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                      Employee
                    </button>
                    <button
                      onClick={() => setExpenseForm({...expenseForm, payeeType: 'other', payeeId: '', payeeName: ''})}
                      className={`px-4 py-2 rounded ${expenseForm.payeeType === 'other' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                      Other
                    </button>
                  </div>
                  
                  {expenseForm.payeeType !== 'other' && (
                    <select
                      value={expenseForm.payeeId}
                      onChange={handlePayeeSelect}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select {expenseForm.payeeType}...</option>
                      {expenseForm.payeeType === 'vendor' && Object.values(masterData.vendors).map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                      {expenseForm.payeeType === 'employee' && Object.values(masterData.employees).map(e => (
                        <option key={e.empId} value={e.empId}>{e.empId} - {e.name}</option>
                      ))}
                    </select>
                  )}
                  
                  {expenseForm.payeeType === 'other' && (
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Expense For</label>
                <div className="flex items-center gap-4">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Receipt/Bill Number</label>
                  <input
                    type="text"
                    value={expenseForm.receiptNo}
                    onChange={(e) => setExpenseForm({...expenseForm, receiptNo: e.target.value})}
                    placeholder="Enter receipt number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                  <input
                    type="text"
                    value={expenseForm.reason}
                    onChange={(e) => setExpenseForm({...expenseForm, reason: e.target.value})}
                    placeholder="Reason for expense"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Narration</label>
                <textarea
                  value={expenseForm.narration}
                  onChange={(e) => setExpenseForm({...expenseForm, narration: e.target.value})}
                  placeholder="Detailed narration"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {expenseForm.payeeId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-800 mb-2">✅ Auto-filled bank details:</p>
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
                Add to Expense Queue
              </button>
            </div>
            
            {/* Pending Expenses List */}
            {expenses.filter(e => e.status === 'pending').length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">Pending Expenses ({expenses.filter(e => e.status === 'pending').length})</h3>
                <div className="space-y-3">
                  {expenses.filter(e => e.status === 'pending').map(exp => (
                    <div key={exp.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-800">{exp.type}</span>
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">{exp.status}</span>
                            {exp.warnings && exp.warnings.length > 0 && (
                              <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">⚠️ {exp.warnings.length} warning(s)</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">
                            {exp.date} | {exp.payeeName} | ₹{parseFloat(exp.amount).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Dr: {exp.drAccount} | Cr: {exp.crAccount}
                          </p>
                          {exp.reason && (
                            <p className="text-xs text-gray-600 mt-1">Reason: {exp.reason}</p>
                          )}
                          {exp.warnings && exp.warnings.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {exp.warnings.map((warning, idx) => (
                                <p key={idx} className="text-xs text-orange-600">⚠️ {warning}</p>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {currentUser.role === 'admin' && (
                            <>
                              <button
                                onClick={() => {
                                  const updated = expenses.map(e => 
                                    e.id === exp.id ? {...e, status: 'approved', approvedBy: currentUser.username, approvedDate: new Date().toISOString()} : e
                                  );
                                  setExpenses(updated);
                                }}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => {
                                  const updated = expenses.map(e => 
                                    e.id === exp.id ? {...e, status: 'rejected', rejectedBy: currentUser.username, rejectedDate: new Date().toISOString()} : e
                                  );
                                  setExpenses(updated);
                                }}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                              >
                                ✗ Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Master Data View */}
        {currentView === 'masterdata' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Employees ({Object.keys(masterData.employees).length})</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.values(masterData.employees).map(emp => (
                  <div key={emp.empId} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{emp.empId} - {emp.name}</p>
                        <p className="text-sm text-gray-600">{emp.department} | {emp.designation}</p>
                        <p className="text-xs text-gray-500">{emp.bankName} - {emp.ifsc} - {emp.accountNo}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {Object.keys(masterData.employees).length === 0 && (
                  <p className="text-gray-500 text-center py-8">No employees yet. Upload monthly payroll to import.</p>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Vendors ({Object.keys(masterData.vendors).length})</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.values(masterData.vendors).map(vendor => (
                  <div key={vendor.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{vendor.name}</p>
                        <p className="text-xs text-gray-500">{vendor.bank} - {vendor.ifsc} - {vendor.accountNo}</p>
                        <p className="text-xs text-gray-400">{vendor.branch}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        vendor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Import Payroll</h2>
            <p className="text-gray-600 mb-4">Upload your monthly payroll CSV to automatically import employees to master data</p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleMonthlyUpload}
                className="hidden"
                id="payroll-upload"
              />
              <label
                htmlFor="payroll-upload"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition"
              >
                <Upload size={20} />
                Upload Monthly Payroll CSV
              </label>
              <p className="text-xs text-gray-500 mt-2">Employee bank details will be automatically imported/updated</p>
            </div>
            
            {paymentBatch.monthly && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="font-semibold text-green-800">✅ Payroll loaded: {paymentBatch.monthly.length} employees</p>
                <p className="text-sm text-green-700 mt-2">Employees have been imported to master data</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;