// Validation utilities for expenses and data

import { CONFIG } from '../config/constants';

// Validate expense amount against configured ranges
export const validateExpenseAmount = (type, amount) => {
  const config = CONFIG.expenseTypes[type];
  if (!config) return { valid: true, warnings: [] };
  
  const amt = parseFloat(amount);
  if (isNaN(amt)) {
    return { valid: false, warnings: ['Invalid amount'] };
  }
  
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
export const checkDuplicateExpense = (newExpense, existingExpenses) => {
  const duplicates = existingExpenses.filter(exp => {
    if (exp.status === 'rejected') return false;
    
    const sameDate = exp.date === newExpense.date;
    const sameType = exp.type === newExpense.type;
    const sameAmount = Math.abs(parseFloat(exp.amount) - parseFloat(newExpense.amount)) < 0.01;
    const samePayee = exp.payeeName === newExpense.payeeName;
    
    return sameDate && sameType && sameAmount && samePayee;
  });
  
  return duplicates.length > 0 ? duplicates : null;
};

// Validate employee data from payroll
export const validateEmployeeData = (employees, isWeekly) => {
  const errors = [];
  
  employees.forEach((emp, idx) => {
    const takeHome = isWeekly ? 
      parseFloat(emp['Gross Pay'] || 0) : 
      parseFloat(emp['Take Home'] || 0);
    
    if (takeHome > 0) {
      if (!emp['Bank Account No']) {
        errors.push(`Row ${idx + 2}: ${emp.Name} has earnings but missing bank account number`);
      }
      if (!emp['IFSC Code']) {
        errors.push(`Row ${idx + 2}: ${emp.Name} has earnings but missing IFSC code`);
      }
      if (!emp['Bank Name']) {
        errors.push(`Row ${idx + 2}: ${emp.Name} has earnings but missing bank name`);
      }
    }
  });
  
  return errors;
};

// Validate bulk upload row
export const validateBulkRow = (row, rowNum) => {
  const errors = [];
  const warnings = [];
  
  // Required fields
  if (!row['Type']) errors.push('Missing Type');
  if (!row['Payee Name']) errors.push('Missing Payee Name');
  if (!row['Amount'] || isNaN(parseFloat(row['Amount']))) {
    errors.push('Missing or invalid Amount');
  }
  
  // Validate expense type
  if (row['Type'] && !CONFIG.expenseTypes[row['Type']]) {
    warnings.push(`Unknown expense type: ${row['Type']}`);
  }
  
  // Validate amount range
  if (row['Type'] && row['Amount'] && CONFIG.expenseTypes[row['Type']]) {
    const validation = validateExpenseAmount(row['Type'], row['Amount']);
    if (validation.warnings.length > 0) {
      warnings.push(...validation.warnings);
    }
  }
  
  return { errors, warnings };
};

// Validate IFSC code format
export const validateIFSC = (ifsc) => {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc);
};

// Validate date format (DD/MM/YYYY)
export const validateDate = (dateString) => {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateString.match(regex);
  
  if (!match) return false;
  
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 2000 || year > 2100) return false;
  
  return true;
};

// Parse date from DD/MM/YYYY to YYYY-MM-DD (for input fields)
export const parseDateToISO = (ddmmyyyy) => {
  if (!ddmmyyyy) return new Date().toISOString().split('T')[0];
  
  const parts = ddmmyyyy.split('/');
  if (parts.length !== 3) return new Date().toISOString().split('T')[0];
  
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// Format date from YYYY-MM-DD to DD/MM/YYYY
export const formatDate = (date) => {
  if (!date) date = new Date();
  if (typeof date === 'string') date = new Date(date);
  
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};
