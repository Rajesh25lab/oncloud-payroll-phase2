import React from 'react';
import { Upload, Download, FileText } from 'lucide-react';

const Payroll = () => {
  return (
    <div className="space-y-6">
      {/* Coming Soon Message */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <FileText className="mx-auto mb-4" size={64} />
          <h2 className="text-3xl font-bold mb-2">Payroll Processing</h2>
          <p className="text-blue-100 mb-4">
            Payroll file upload and processing features will be available soon
          </p>
          <div className="bg-white/10 rounded-lg p-4 max-w-2xl mx-auto">
            <h3 className="font-semibold mb-2">Planned Features:</h3>
            <ul className="text-sm space-y-1 text-left">
              <li>✓ Monthly payroll file upload</li>
              <li>✓ Weekly payroll file upload</li>
              <li>✓ Automatic employee import</li>
              <li>✓ Bank file generation (Kotak format)</li>
              <li>✓ Tally journal file generation</li>
              <li>✓ Bulk payment processing</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Feature Preview Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Upload className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Upload Payroll Files</h3>
              <p className="text-sm text-gray-600">CSV/TSV format from PetPooja</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Upload monthly or weekly payroll files exported from your PetPooja system.
            Employees will be automatically imported to master data.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Download className="text-green-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Generate Payment Files</h3>
              <p className="text-sm text-gray-600">Bank & Tally integration</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Automatically generate bank upload files for Kotak Mahindra Bank and
            Tally journal entries for accounting.
          </p>
        </div>
      </div>

      {/* Note */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
        <h3 className="font-bold text-yellow-900 mb-2">📝 Note</h3>
        <p className="text-yellow-800 text-sm">
          This functionality is currently being extracted from the legacy codebase and will be
          available in the next update. The old implementation is backed up in App.jsx.backup
          and will be modularized soon.
        </p>
      </div>
    </div>
  );
};

export default Payroll;
