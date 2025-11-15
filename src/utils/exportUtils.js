// Export utilities for templates and data downloads

import { CONFIG } from '../config/constants';

// Generate unique IDs
export const generateId = (prefix) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
};

// Generate unique journal numbers
export const generateJournalNumber = (prefix, index) => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}`;
  return `${prefix}-${dateStr}-${index.toString().padStart(3, '0')}`;
};

// Download Excel template for bulk upload with dropdown reference
export const downloadExcelTemplate = (masterData) => {
  // Create main expense entry sheet
  const headers = ['Date', 'Type*', 'Payee/Vendor*', 'Amount*', 'Receipt#', 'Reason', 'Narration'];
  
  const instructions = [
    'DD/MM/YYYY',
    'Choose from list below',
    'Choose from list below',
    'Number only',
    'Optional',
    'Optional',
    'Optional'
  ];
  
  const samples = [
    ['15/11/2025', 'Petrol', 'BHAIRAAV WATER SYSTEMS', '500', 'INV-001', 'Vehicle fuel', 'Daily petrol'],
    ['14/11/2025', 'Rent', 'ALPINE', '120000', 'RENT-NOV', 'Monthly rent', 'Factory rent payment'],
    ['', 'Advance', 'Anibash das', '5000', '', 'Emergency', 'Staff advance']
  ];
  
  // Build sections
  const sections = [];
  
  // Main entry area
  sections.push('=== FILL YOUR EXPENSES BELOW (Delete sample rows) ===');
  sections.push(headers.join(','));
  sections.push(instructions.join(','));
  sections.push('');
  sections.push(...samples.map(row => row.map(cell => `"${cell}"`).join(',')));
  sections.push('');
  sections.push('');
  
  // Expense Types Reference (for dropdown)
  sections.push('=== EXPENSE TYPES - Copy exact name to Type column ===');
  Object.keys(CONFIG.expenseTypes).forEach(type => {
    sections.push(`"${type}"`);
  });
  sections.push('');
  sections.push('');
  
  // Vendors Reference (for dropdown)
  sections.push('=== VENDORS - Copy exact name to Payee column ===');
  sections.push('Vendor Name,Bank,IFSC,Account');
  Object.values(masterData.vendors || {}).forEach(v => {
    sections.push(`"${v.name}","${v.bank}","${v.ifsc}","${v.accountNo}"`);
  });
  sections.push('');
  sections.push('');
  
  // Employees Reference (for dropdown)
  sections.push('=== EMPLOYEES - Copy exact name to Payee column ===');
  sections.push('Emp ID,Name,Department,Bank,IFSC,Account');
  Object.values(masterData.employees || {}).forEach(e => {
    sections.push(`"${e.empId}","${e.name}","${e.department || ''}","${e.bankName}","${e.ifsc}","${e.accountNo}"`);
  });
  
  const csv = sections.join('\n');
  downloadCSV(csv, `Expense_Template_${new Date().toISOString().split('T')[0]}.csv`);
};

// Download template for bulk importing vendors
export const downloadVendorImportTemplate = () => {
  const headers = ['Vendor Name*', 'Bank Name*', 'IFSC Code*', 'Account Number*', 'Branch', 'Status'];
  const instructions = ['Required', 'Required', 'Required (11 chars)', 'Required', 'Optional', 'Active/Inactive'];
  const samples = [
    ['ABC Suppliers', 'HDFC Bank', 'HDFC0001234', '12345678901', 'Mumbai Branch', 'Active'],
    ['XYZ Services', 'ICICI Bank', 'ICIC0005678', '98765432101', 'Delhi Branch', 'Active']
  ];
  
  const rows = [
    headers.join(','),
    instructions.join(','),
    '',
    '=== SAMPLE DATA - Delete before uploading ===',
    ...samples.map(row => row.map(cell => `"${cell}"`).join(','))
  ];
  
  const csv = rows.join('\n');
  downloadCSV(csv, `Vendor_Import_Template_${new Date().toISOString().split('T')[0]}.csv`);
};

// Download template for bulk importing employees  
export const downloadEmployeeImportTemplate = () => {
  const headers = ['Emp ID*', 'Name*', 'Department', 'Designation', 'Bank Name*', 'IFSC Code*', 'Account Number*', 'Branch', 'Account Type'];
  const instructions = ['E0001', 'Required', 'Optional', 'Optional', 'Required', 'Required', 'Required', 'Optional', 'Saving/Current'];
  const samples = [
    ['E0201', 'John Doe', 'Sales', 'Manager', 'HDFC Bank', 'HDFC0001234', '12345678901', 'Mumbai', 'Saving'],
    ['E0202', 'Jane Smith', 'Accounts', 'Accountant', 'ICICI Bank', 'ICIC0005678', '98765432101', 'Delhi', 'Saving']
  ];
  
  const rows = [
    headers.join(','),
    instructions.join(','),
    '',
    '=== SAMPLE DATA - Delete before uploading ===',
    ...samples.map(row => row.map(cell => `"${cell}"`).join(','))
  ];
  
  const csv = rows.join('\n');
  downloadCSV(csv, `Employee_Import_Template_${new Date().toISOString().split('T')[0]}.csv`);
};

// Download master data reference lists
export const downloadMasterDataLists = (masterData) => {
  const sections = [];
  
  // Expense Types
  sections.push('=== EXPENSE TYPES (Copy exact names for Type column) ===');
  sections.push('Type,Dr Account,TDS,Min Amount,Max Amount,Category');
  Object.entries(CONFIG.expenseTypes).forEach(([type, config]) => {
    sections.push(`"${type}","${config.dr}","${config.tds || 'None'}",${config.minAmount || 0},${config.maxAmount || 'No limit'},"${config.category}"`);
  });
  sections.push('');
  
  // Vendors
  sections.push('=== VENDORS (Copy exact names for Payee Name column) ===');
  sections.push('Vendor ID,Vendor Name,Bank,IFSC,Account No,Branch,Status');
  Object.values(masterData.vendors || {}).forEach(v => {
    sections.push(`"${v.id}","${v.name}","${v.bank}","${v.ifsc}","${v.accountNo}","${v.branch || ''}","${v.status}"`);
  });
  sections.push('');
  
  // Employees
  sections.push('=== EMPLOYEES (Copy exact names or Emp ID for Payee Name / For Employee ID) ===');
  sections.push('Emp ID,Name,Department,Designation,Bank,IFSC,Account No,Branch');
  Object.values(masterData.employees || {}).forEach(e => {
    sections.push(`"${e.empId}","${e.name}","${e.department || ''}","${e.designation || ''}","${e.bankName}","${e.ifsc}","${e.accountNo}","${e.branch || ''}"`);
  });
  
  const csv = sections.join('\n');
  downloadCSV(csv, `Master_Data_Reference_${new Date().toISOString().split('T')[0]}.csv`);
};

// Export expenses to Excel
export const exportExpenses = (expenses, filter = 'all') => {
  let filteredExpenses = expenses;
  
  if (filter !== 'all') {
    filteredExpenses = expenses.filter(exp => exp.status === filter);
  }
  
  const headers = [
    'Date', 'Type', 'Payee Name', 'Amount', 'Receipt#', 'Reason', 'Narration',
    'Dr Account', 'Cr Account', 'TDS', 'Net Amount', 'Status', 
    'Submitted By', 'Submitted Date', 'Approved By', 'Approved Date'
  ];
  
  const rows = filteredExpenses.map(exp => {
    const grossAmount = parseFloat(exp.amount);
    const tdsAmount = grossAmount * (exp.tdsRate || 0);
    const netAmount = grossAmount - tdsAmount;
    
    return [
      exp.date,
      exp.type,
      exp.payeeName,
      grossAmount.toFixed(2),
      exp.receiptNo || '',
      exp.reason || '',
      exp.narration || '',
      exp.drAccount,
      exp.crAccount,
      exp.tds || 'None',
      netAmount.toFixed(2),
      exp.status,
      exp.submittedByName || exp.submittedBy,
      new Date(exp.submittedDate).toLocaleDateString(),
      exp.approvedBy || '',
      exp.approvedDate ? new Date(exp.approvedDate).toLocaleDateString() : ''
    ].map(cell => `"${cell}"`).join(',');
  });
  
  const csv = [headers.join(','), ...rows].join('\n');
  const filename = filter === 'all' ? 
    'All_Expenses' : 
    `${filter.charAt(0).toUpperCase() + filter.slice(1)}_Expenses`;
  downloadCSV(csv, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
};

// Export master data (employees and vendors)
export const exportMasterData = (masterData) => {
  const sections = [];
  
  // Employees
  sections.push('=== EMPLOYEES ===');
  sections.push('Emp ID,Name,Department,Designation,Bank Name,IFSC,Account No,Branch,Account Type');
  Object.values(masterData.employees || {}).forEach(e => {
    sections.push([
      e.empId, e.name, e.department || '', e.designation || '',
      e.bankName, e.ifsc, e.accountNo, e.branch || '', e.accountType || ''
    ].map(cell => `"${cell}"`).join(','));
  });
  sections.push('');
  
  // Vendors
  sections.push('=== VENDORS ===');
  sections.push('Vendor ID,Name,Bank,IFSC,Account No,Branch,Status');
  Object.values(masterData.vendors || {}).forEach(v => {
    sections.push([
      v.id, v.name, v.bank, v.ifsc, v.accountNo, v.branch || '', v.status
    ].map(cell => `"${cell}"`).join(','));
  });
  
  const csv = sections.join('\n');
  downloadCSV(csv, `Master_Data_Backup_${new Date().toISOString().split('T')[0]}.csv`);
};

// Helper function to trigger CSV download
const downloadCSV = (csv, filename) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Parse CSV/Excel data
export const parseCSVData = (text) => {
  const lines = text.trim().split('\n').filter(line => 
    line.trim() && 
    !line.startsWith('===') && 
    !line.toLowerCase().includes('sample data')
  );
  
  if (lines.length < 2) {
    throw new Error('File appears to be empty or invalid');
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').replace('*', ''));
  const dataRows = lines.slice(1).filter(line => {
    const firstCell = line.split(',')[0]?.trim().replace(/"/g, '');
    return firstCell && !firstCell.toLowerCase().includes('dd/mm/yyyy');
  });
  
  const data = dataRows.map(line => {
    // Handle quoted CSV values
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || '').replace(/"/g, '');
    });
    
    return row;
  });
  
  return data;
};
