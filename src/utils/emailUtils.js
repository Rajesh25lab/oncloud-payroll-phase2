// Email utility for sending bank and tally files
// Uses EmailJS (free service for client-side email sending)

// Email configuration
const EMAIL_CONFIG = {
  serviceId: 'service_oncloud', // You'll get this from EmailJS
  templateId: 'template_payroll', // You'll create this template
  publicKey: 'YOUR_PUBLIC_KEY', // You'll get this from EmailJS
  toEmail: 'rajesh@oncloudindia.com' // Your email
};

// Initialize EmailJS (add this script to index.html)
// <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>

// Send bank file via email
export const sendBankFileEmail = async (fileContent, fileName, summary) => {
  try {
    // Check if EmailJS is loaded
    if (typeof window.emailjs === 'undefined') {
      throw new Error('EmailJS not loaded. Please add EmailJS script to index.html');
    }

    const emailParams = {
      to_email: EMAIL_CONFIG.toEmail,
      subject: `Bank Upload File - ${fileName}`,
      file_name: fileName,
      file_content: fileContent,
      summary: `
        Total Payees: ${summary.totalPayees}
        Total Amount: ₹${summary.totalAmount}
        Generated: ${new Date().toLocaleString()}
      `,
      message: 'Please find the bank upload file attached. Ready to upload to Kotak portal.'
    };

    const response = await window.emailjs.send(
      EMAIL_CONFIG.serviceId,
      EMAIL_CONFIG.templateId,
      emailParams,
      EMAIL_CONFIG.publicKey
    );

    return { success: true, message: 'Email sent successfully!' };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, message: error.message };
  }
};

// Send tally file via email
export const sendTallyFileEmail = async (fileContent, fileName, summary) => {
  try {
    if (typeof window.emailjs === 'undefined') {
      throw new Error('EmailJS not loaded. Please add EmailJS script to index.html');
    }

    const emailParams = {
      to_email: EMAIL_CONFIG.toEmail,
      subject: `Tally Journal File - ${fileName}`,
      file_name: fileName,
      file_content: fileContent,
      summary: `
        Total Payees: ${summary.totalPayees}
        Total Amount: ₹${summary.totalAmount}
        Total Journals: ${summary.journalCount}
        Generated: ${new Date().toLocaleString()}
      `,
      message: 'Please find the Tally journal file attached. Ready to import via Suvit.io'
    };

    const response = await window.emailjs.send(
      EMAIL_CONFIG.serviceId,
      EMAIL_CONFIG.templateId,
      emailParams,
      EMAIL_CONFIG.publicKey
    );

    return { success: true, message: 'Email sent successfully!' };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, message: error.message };
  }
};

// Alternative: Use mailto link (browser-based, no setup needed)
export const sendViaMailto = (fileName, summary, fileType = 'bank') => {
  const subject = `${fileType === 'bank' ? 'Bank Upload' : 'Tally Journal'} File - ${fileName}`;
  const body = `
Hi,

Please find the ${fileType === 'bank' ? 'bank upload' : 'Tally journal'} file ready for processing.

Summary:
- Total Payees: ${summary.totalPayees}
- Total Amount: ₹${summary.totalAmount}
${fileType === 'tally' ? `- Total Journals: ${summary.journalCount}` : ''}
- Generated: ${new Date().toLocaleString()}

Note: The file has been downloaded to your computer. Please attach it manually to this email.

Thanks!
  `.trim();

  const mailtoLink = `mailto:${EMAIL_CONFIG.toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoLink;
  
  return { success: true, message: 'Email client opened. Please attach the downloaded file.' };
};

// WhatsApp sharing (alternative)
export const sendViaWhatsApp = (fileName, summary, phoneNumber = '919876543210') => {
  const message = `
*Payroll Files Ready*

File: ${fileName}
Payees: ${summary.totalPayees}
Amount: ₹${summary.totalAmount}
Time: ${new Date().toLocaleString()}

File downloaded. Please check your computer.
  `.trim();

  const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappLink, '_blank');
  
  return { success: true, message: 'WhatsApp opened. File reminder sent.' };
};

// Update email configuration
export const updateEmailConfig = (newConfig) => {
  Object.assign(EMAIL_CONFIG, newConfig);
  localStorage.setItem('emailConfig', JSON.stringify(EMAIL_CONFIG));
};

// Load email configuration
export const loadEmailConfig = () => {
  const saved = localStorage.getItem('emailConfig');
  if (saved) {
    Object.assign(EMAIL_CONFIG, JSON.parse(saved));
  }
  return EMAIL_CONFIG;
};

export { EMAIL_CONFIG };
