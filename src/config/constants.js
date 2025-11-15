// Initial vendor data
export const INITIAL_VENDORS = [
  { id: 'V001', name: 'ALPINE', accountNo: '1246261006174', ifsc: 'CNRB0002344', bank: 'Canara Bank', branch: 'karur', status: 'Active' },
  { id: 'V002', name: 'AMMAN TRADERS', accountNo: '4037201000436', ifsc: 'CNRB0004037', bank: 'Canara Bank', branch: 'TIRUPPUR', status: 'Active' },
  { id: 'V003', name: 'AMMAN TRADERS KUMARAN', accountNo: '9613576100', ifsc: 'KKBK0008785', bank: 'Kotak Mahindra Bank', branch: '', status: 'Active' },
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
export const CONFIG = {
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
  
  // Expense types with validation ranges
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

export const DEFAULT_USER = {
  username: 'admin',
  password: 'admin123',
  name: 'Rajesh',
  empId: 'ADMIN',
  role: 'admin',
  email: 'rajesh@oncloudindia.com'
};
