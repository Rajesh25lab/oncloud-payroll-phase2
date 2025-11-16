// Enhanced CSV Validation Utilities
// Shows EXACTLY what's wrong with uploaded files

// Expected column configurations
export const CSV_TEMPLATES = {
  vendor: {
    required: ['Vendor Name', 'Bank Name', 'IFSC Code', 'Account Number'],
    optional: ['Branch', 'Status'],
    example: {
      'Vendor Name': 'ABC Suppliers Pvt Ltd',
      'Bank Name': 'HDFC Bank',
      'IFSC Code': 'HDFC0001234',
      'Account Number': '12345678901',
      'Branch': 'Mumbai Branch',
      'Status': 'Active'
    }
  },
  employee: {
    required: ['Emp ID', 'Name', 'Bank Name', 'IFSC Code', 'Account Number'],
    optional: ['Department', 'Designation', 'Branch', 'Account Type'],
    example: {
      'Emp ID': 'E0001',
      'Name': 'John Doe',
      'Department': 'Sales',
      'Designation': 'Manager',
      'Bank Name': 'HDFC Bank',
      'IFSC Code': 'HDFC0001234',
      'Account Number': '12345678901',
      'Branch': 'Mumbai Branch',
      'Account Type': 'Saving'
    }
  },
  expense: {
    required: ['Date', 'Type', 'Payee/Vendor', 'Amount'],
    optional: ['Receipt No', 'Narration', 'Reason', 'Payee Type'],
    example: {
      'Date': '15/11/2024',
      'Type': 'Petrol',
      'Payee/Vendor': 'Shell Petrol Pump',
      'Amount': '2500',
      'Receipt No': 'INV-12345',
      'Narration': 'Monthly fuel expense',
      'Reason': 'Official vehicle',
      'Payee Type': 'vendor'
    }
  }
};

// Validate CSV structure and return detailed errors
export const validateCSVStructure = (headers, templateType) => {
  const template = CSV_TEMPLATES[templateType];
  if (!template) {
    return { valid: false, errors: [`Unknown template type: ${templateType}`] };
  }

  const errors = [];
  const warnings = [];
  const found = headers.map(h => h.trim());
  const required = template.required;
  const optional = template.optional || [];

  // Check for missing required columns
  const missing = required.filter(col => 
    !found.some(h => h.toLowerCase() === col.toLowerCase())
  );

  if (missing.length > 0) {
    errors.push({
      type: 'missing_columns',
      severity: 'critical',
      message: `Missing ${missing.length} required column(s)`,
      missing: missing,
      found: found,
      expected: [...required, ...optional]
    });
  }

  // Check for extra/unrecognized columns
  const allExpected = [...required, ...optional];
  const extra = found.filter(h => 
    !allExpected.some(col => col.toLowerCase() === h.toLowerCase())
  );

  if (extra.length > 0) {
    warnings.push({
      type: 'extra_columns',
      severity: 'warning',
      message: `Found ${extra.length} unrecognized column(s)`,
      extra: extra,
      note: 'These columns will be ignored'
    });
  }

  // Check for misspelled columns (fuzzy matching)
  const possibleMisspellings = [];
  missing.forEach(missingCol => {
    found.forEach(foundCol => {
      const similarity = calculateSimilarity(missingCol.toLowerCase(), foundCol.toLowerCase());
      if (similarity > 0.6) {
        possibleMisspellings.push({
          expected: missingCol,
          found: foundCol,
          similarity: Math.round(similarity * 100)
        });
      }
    });
  });

  if (possibleMisspellings.length > 0) {
    warnings.push({
      type: 'possible_misspelling',
      severity: 'warning',
      message: 'Possible column name misspellings detected',
      suggestions: possibleMisspellings
    });
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    template: template,
    found: found
  };
};

// Simple string similarity (Levenshtein distance based)
const calculateSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Generate detailed error report for UI
export const generateErrorReport = (validation, templateType) => {
  const report = {
    title: `CSV Structure Error - ${templateType.charAt(0).toUpperCase() + templateType.slice(1)} Import`,
    summary: '',
    sections: []
  };

  if (validation.errors.length > 0) {
    const error = validation.errors[0];
    
    report.summary = error.message;
    
    // Missing columns section
    if (error.type === 'missing_columns') {
      report.sections.push({
        title: '❌ Missing Required Columns',
        type: 'error',
        items: error.missing.map(col => ({
          text: col,
          example: validation.template.example[col]
        }))
      });
      
      report.sections.push({
        title: '✅ Columns Found in Your File',
        type: 'info',
        items: error.found.map(col => ({ text: col }))
      });
      
      report.sections.push({
        title: '📋 Expected Columns',
        type: 'info',
        items: error.expected.map(col => ({
          text: col,
          required: validation.template.required.includes(col),
          example: validation.template.example[col]
        }))
      });
    }
  }

  // Add warnings
  if (validation.warnings.length > 0) {
    validation.warnings.forEach(warning => {
      if (warning.type === 'possible_misspelling') {
        report.sections.push({
          title: '💡 Did You Mean?',
          type: 'warning',
          items: warning.suggestions.map(s => ({
            text: `"${s.found}" might be "${s.expected}" (${s.similarity}% match)`
          }))
        });
      } else if (warning.type === 'extra_columns') {
        report.sections.push({
          title: '⚠️ Extra Columns (Will Be Ignored)',
          type: 'warning',
          items: warning.extra.map(col => ({ text: col }))
        });
      }
    });
  }

  // Add example format
  report.sections.push({
    title: '📝 Correct CSV Format',
    type: 'success',
    csvExample: Object.keys(validation.template.example).join(',') + '\n' +
                Object.values(validation.template.example).join(',')
  });

  return report;
};

// Validate individual row data
export const validateRowData = (row, rowIndex, templateType) => {
  const template = CSV_TEMPLATES[templateType];
  const errors = [];
  
  template.required.forEach(col => {
    const value = row[col];
    if (!value || value.trim() === '') {
      errors.push({
        row: rowIndex + 2, // +2 because of header and 0-index
        column: col,
        message: `Missing required field: ${col}`,
        example: template.example[col]
      });
    }
  });
  
  return errors;
};
