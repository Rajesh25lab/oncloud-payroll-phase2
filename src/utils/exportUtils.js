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

// Download SUPER SIMPLE expense template
export const downloadExpenseTemplate = (masterData) => {
  const rows = [];
  
  // Clear title
  rows.push('"=== EXPENSE BULK UPLOAD TEMPLATE ==="');
  rows.push('');
  
  // Simple instructions
  rows.push('"HOW TO USE:"');
  rows.push('"1. Fill ONLY the first 5 columns: Date, Type, Payee, Amount, Receipt#"');
  rows.push('"2. Look at column H for all expense types - copy exact name"');
  rows.push('"3. Look at column K for all vendors - copy exact name"');
  rows.push('"4. Delete these instruction rows and sample rows before uploading"');
  rows.push('');
  
  // Headers with dropdown lists side by side
  rows.push('Date,Type,Payee/Vendor,Amount,Receipt#,Reason,Narration,,EXPENSE TYPES,,,VENDORS (with bank details),Bank,IFSC,Account,,EMPLOYEES (with bank details),Bank,IFSC,Account');
  rows.push('DD/MM/YYYY,Required,Required,Required,Optional,Optional,Optional,,← Copy from here,,,← Copy from here,,,,, ← Copy from here,,,');
  rows.push('');
  
  // Sample data
  rows.push('"15/11/2025","Petrol","BHAIRAAV WATER SYSTEMS","500","INV-001","Vehicle fuel","Daily petrol"');
  rows.push('"14/11/2025","Rent","ALPINE","120000","RENT-NOV","Monthly rent",""');
  rows.push('"13/11/2025","Advance","Anibash das","5000","","Emergency",""');
  rows.push('');
  
  // Build reference columns
  const expenseTypes = Object.keys(CONFIG.expenseTypes);
  const vendors = Object.values(masterData.vendors || {});
  const employees = Object.values(masterData.employees || {});
  
  const maxRows = Math.max(expenseTypes.length, vendors.length, employees.length);
  
  for (let i = 0; i < maxRows; i++) {
    const cols = ['', '', '', '', '', '', '', '']; // Empty expense columns
    
    // Expense type column
    if (i < expenseTypes.length) {
      cols.push(`"${expenseTypes[i]}"`, '', '');
    } else {
      cols.push('', '', '');
    }
    
    // Vendor columns
    if (i < vendors.length) {
      const v = vendors[i];
      cols.push(`"${v.name}"`, `"${v.bank}"`, `"${v.ifsc}"`, `"${v.accountNo}"`, '');
    } else {
      cols.push('', '', '', '', '');
    }
    
    // Employee columns
    if (i < employees.length) {
      const e = employees[i];
      cols.push(`"${e.name}"`, `"${e.bankName}"`, `"${e.ifsc}"`, `"${e.accountNo}"`);
    } else {
      cols.push('', '', '', '');
    }
    
    rows.push(cols.join(','));
  }
  
  const csv = rows.join('\n');
  downloadCSV(csv, `Expense_BulkUpload_${new Date().toISOString().split('T')[0]}.csv`);
};

// Download SIMPLE vendor import template
export const downloadVendorTemplate = () => {
  const rows = [];
  
  rows.push('"=== VENDOR BULK IMPORT TEMPLATE ==="');
  rows.push('');
  rows.push('"HOW TO USE:"');
  rows.push('"1. Fill all columns A to E (Branch is optional)"');
  rows.push('"2. One vendor per row"');
  rows.push('"3. Delete these instruction rows and sample rows before uploading"');
  rows.push('');
  rows.push('"Vendor Name","Bank Name","IFSC Code","Account Number","Branch"');
  rows.push('"Required","Required","Required (11 chars)","Required","Optional"');
  rows.push('');
  rows.push('"ABC Suppliers","HDFC Bank","HDFC0001234","12345678901","Mumbai Branch"');
  rows.push('"XYZ Services","ICICI Bank","ICIC0005678","98765432101","Delhi Branch"');
  
  const csv = rows.join('\n');
  downloadCSV(csv, `Vendor_Import_${new Date().toISOString().split('T')[0]}.csv`);
};

// Download SIMPLE employee import template
export const downloadEmployeeTemplate = () => {
  const rows = [];
  
  rows.push('"=== EMPLOYEE BULK IMPORT TEMPLATE ==="');
  rows.push('');
  rows.push('"HOW TO USE:"');
  rows.push('"1. Fill columns A to G (Department, Designation, Branch are optional)"');
  rows.push('"2. Emp ID format: E0001, E0002, etc."');
  rows.push('"3. One employee per row"');
  rows.push('"4. Delete these instruction rows and sample rows before uploading"');
  rows.push('');
  rows.push('"Emp ID","Name","Department","Designation","Bank Name","IFSC Code","Account Number","Branch"');
  rows.push('"Required","Required","Optional","Optional","Required","Required","Required","Optional"');
  rows.push('');
  rows.push('"E0201","John Doe","Sales","Manager","HDFC Bank","HDFC0001234","12345678901","Mumbai Branch"');
  rows.push('"E0202","Jane Smith","Accounts","Accountant","ICICI Bank","ICIC0005678","98765432101","Delhi Branch"');
  
  const csv = rows.join('\n');
  downloadCSV(csv, `Employee_Import_${new Date().toISOString().split('T')[0]}.csv`);
};

// Download master data reference lists
export const downloadMasterDataLists = (masterData) => {
  const sections = [];
  
  // Expense Types
  sections.push('"=== EXPENSE TYPES ==="');
  sections.push('"Type","Dr Account","TDS","Min Amount","Max Amount"');
  Object.entries(CONFIG.expenseTypes).forEach(([type, config]) => {
    sections.push(`"${type}","${config.dr}","${config.tds || 'None'}",${config.minAmount || 0},${config.maxAmount || 'No limit'}`);
  });
  sections.push('');
  
  // Vendors
  sections.push('"=== VENDORS ==="');
  sections.push('"Vendor Name","Bank","IFSC","Account No","Branch","Status"');
  Object.values(masterData.vendors || {}).forEach(v => {
    sections.push(`"${v.name}","${v.bank}","${v.ifsc}","${v.accountNo}","${v.branch || ''}","${v.status}"`);
  });
  sections.push('');
  
  // Employees
  sections.push('"=== EMPLOYEES ==="');
  sections.push('"Emp ID","Name","Department","Designation","Bank Name","IFSC","Account No","Branch"');
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
  sections.push('"=== EMPLOYEES ==="');
  sections.push('"Emp ID","Name","Department","Designation","Bank Name","IFSC","Account No","Branch","Account Type"');
  Object.values(masterData.employees || {}).forEach(e => {
    sections.push([
      e.empId, e.name, e.department || '', e.designation || '',
      e.bankName, e.ifsc, e.accountNo, e.branch || '', e.accountType || ''
    ].map(cell => `"${cell}"`).join(','));
  });
  sections.push('');
  
  // Vendors
  sections.push('"=== VENDORS ==="');
  sections.push('"Vendor ID","Name","Bank","IFSC","Account No","Branch","Status"');
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
  const lines = text.trim().split('\n').filter(line => {
    const lower = line.toLowerCase();
    return line.trim() && 
           !line.startsWith('===') && 
           !lower.includes('sample') &&
           !lower.includes('instruction') &&
           !lower.includes('how to use') &&
           !lower.includes('delete these');
  });
  
  if (lines.length < 2) {
    throw new Error('File appears to be empty or invalid');
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').replace('*', ''));
  const dataRows = lines.slice(1).filter(line => {
    const firstCell = line.split(',')[0]?.trim().replace(/"/g, '').toLowerCase();
    return firstCell && 
           !firstCell.includes('dd/mm/yyyy') && 
           !firstCell.includes('required') &&
           !firstCell.includes('optional') &&
           firstCell.length > 0;
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
