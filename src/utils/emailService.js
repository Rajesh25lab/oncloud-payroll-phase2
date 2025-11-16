// Email Service - Auto-send generated files via EmailJS
// Uses EmailJS free service (https://www.emailjs.com)

/**
 * SETUP INSTRUCTIONS:
 * 1. Go to https://www.emailjs.com and create free account
 * 2. Create email service (Gmail recommended)
 * 3. Create email template with these variables:
 *    - {{to_email}} - recipient email
 *    - {{from_name}} - sender name
 *    - {{message}} - email body
 *    - {{file_name}} - attachment name
 *    - {{file_data}} - base64 file data
 * 4. Get your credentials and update below
 */

// EmailJS Configuration
const EMAILJS_CONFIG = {
  serviceId: 'YOUR_SERVICE_ID',        // Replace with your EmailJS service ID
  templateId: 'YOUR_TEMPLATE_ID',      // Replace with your EmailJS template ID
  publicKey: 'YOUR_PUBLIC_KEY',        // Replace with your EmailJS public key
  recipientEmail: 'rajesh@oncloudindia.com'  // Your email address
};

// Initialize EmailJS (will be loaded from CDN in index.html)
export const initEmailJS = () => {
  if (window.emailjs) {
    window.emailjs.init(EMAILJS_CONFIG.publicKey);
    return true;
  }
  console.warn('EmailJS not loaded. Add script to index.html');
  return false;
};

// Send email with attachment
export const sendEmail = async (subject, message, fileName, fileContent, fileType = 'text/csv') => {
  try {
    // Check if EmailJS is available
    if (!window.emailjs) {
      throw new Error('EmailJS not loaded. Please add EmailJS script to index.html');
    }

    // Convert file content to base64 if needed
    let base64Data = fileContent;
    if (fileContent instanceof Blob) {
      base64Data = await blobToBase64(fileContent);
    }

    // Prepare email parameters
    const templateParams = {
      to_email: EMAILJS_CONFIG.recipientEmail,
      from_name: 'OnCloud Payroll System',
      subject: subject,
      message: message,
      file_name: fileName,
      file_data: base64Data,
      file_type: fileType,
      sent_date: new Date().toLocaleString()
    };

    // Send email via EmailJS
    const response = await window.emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );

    return {
      success: true,
      messageId: response.text,
      message: `Email sent successfully to ${EMAILJS_CONFIG.recipientEmail}`
    };

  } catch (error) {
    console.error('Email send failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send email. Check EmailJS configuration.'
    };
  }
};

// Convert Blob to base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // Remove data URL prefix
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Send bank file via email
export const sendBankFile = async (csvContent, fileName) => {
  const subject = `Bank Payment File - ${fileName}`;
  const message = `
Bank payment file generated from OnCloud Payroll System.

File: ${fileName}
Generated: ${new Date().toLocaleString()}

Please upload this file to your Kotak bank portal to process payments.

Note: This is an automated email from your payroll system.
  `.trim();

  return await sendEmail(subject, message, fileName, csvContent, 'text/csv');
};

// Send Tally file via email
export const sendTallyFile = async (csvContent, fileName) => {
  const subject = `Tally Journal File - ${fileName}`;
  const message = `
Tally journal file generated from OnCloud Payroll System.

File: ${fileName}
Generated: ${new Date().toLocaleString()}

Please upload this file to Suvit.io or import directly to Tally.

Note: This is an automated email from your payroll system.
  `.trim();

  return await sendEmail(subject, message, fileName, csvContent, 'text/csv');
};

// Send both files together
export const sendPayrollFiles = async (bankFile, tallyFile, summary) => {
  const subject = `Payroll Files - ${new Date().toLocaleDateString()}`;
  const message = `
Complete payroll files generated from OnCloud Payroll System.

Summary:
- Total Payees: ${summary.totalPayees}
- Total Amount: ₹${summary.totalAmount}
- Generated: ${new Date().toLocaleString()}

Files Attached:
1. ${bankFile.name} - For bank upload
2. ${tallyFile.name} - For Tally/Suvit.io

Next Steps:
1. Download both files from this email
2. Upload bank file to Kotak payment portal
3. Upload Tally file to Suvit.io or Tally

Note: This is an automated email from your payroll system.
  `.trim();

  // Send bank file
  const bankResult = await sendBankFile(bankFile.content, bankFile.name);
  
  // Send Tally file
  const tallyResult = await sendTallyFile(tallyFile.content, tallyFile.name);

  return {
    success: bankResult.success && tallyResult.success,
    bankResult,
    tallyResult,
    message: bankResult.success && tallyResult.success 
      ? 'Both files sent successfully!'
      : 'Some files failed to send. Check individual results.'
  };
};

// Email configuration validator
export const validateEmailConfig = () => {
  const errors = [];
  
  if (EMAILJS_CONFIG.serviceId === 'YOUR_SERVICE_ID') {
    errors.push('EmailJS Service ID not configured');
  }
  if (EMAILJS_CONFIG.templateId === 'YOUR_TEMPLATE_ID') {
    errors.push('EmailJS Template ID not configured');
  }
  if (EMAILJS_CONFIG.publicKey === 'YOUR_PUBLIC_KEY') {
    errors.push('EmailJS Public Key not configured');
  }
  if (!EMAILJS_CONFIG.recipientEmail || EMAILJS_CONFIG.recipientEmail.includes('example')) {
    errors.push('Recipient email not configured');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Test email function
export const sendTestEmail = async () => {
  const validation = validateEmailConfig();
  if (!validation.isValid) {
    return {
      success: false,
      message: 'Email configuration incomplete',
      errors: validation.errors
    };
  }

  const subject = 'Test Email - OnCloud Payroll System';
  const message = `
This is a test email from your OnCloud Payroll System.

If you receive this email, your email integration is working correctly!

Sent: ${new Date().toLocaleString()}
  `.trim();

  return await sendEmail(subject, message, 'test.txt', 'This is a test attachment', 'text/plain');
};

export default {
  initEmailJS,
  sendEmail,
  sendBankFile,
  sendTallyFile,
  sendPayrollFiles,
  validateEmailConfig,
  sendTestEmail,
  EMAILJS_CONFIG
};
