import React from 'react';
import { AlertCircle, XCircle, AlertTriangle, Info, X, Copy, Download } from 'lucide-react';

// Robust Error Display Component
const ErrorDisplay = ({ errors, onClose, context = 'general' }) => {
  if (!errors || errors.length === 0) return null;

  // Copy errors to clipboard
  const copyToClipboard = () => {
    const errorText = errors.map((err, idx) => 
      typeof err === 'string' ? `${idx + 1}. ${err}` : `${idx + 1}. ${err.message || err.error || JSON.stringify(err)}`
    ).join('\n');
    
    navigator.clipboard.writeText(errorText);
    alert('✅ Errors copied to clipboard!');
  };

  // Download errors as text file
  const downloadErrors = () => {
    const errorText = errors.map((err, idx) => 
      typeof err === 'string' ? `${idx + 1}. ${err}` : `${idx + 1}. ${err.message || err.error || JSON.stringify(err)}`
    ).join('\n');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const blob = new Blob([`ERRORS - ${context}\nGenerated: ${new Date().toLocaleString()}\n\n${errorText}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `errors_${context}_${timestamp}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Categorize errors
  const categorizedErrors = {
    critical: [],
    validation: [],
    warning: [],
    info: []
  };

  errors.forEach(err => {
    const errStr = typeof err === 'string' ? err.toLowerCase() : (err.message || err.error || '').toLowerCase();
    
    if (errStr.includes('missing') || errStr.includes('required') || errStr.includes('invalid')) {
      categorizedErrors.validation.push(err);
    } else if (errStr.includes('warning') || errStr.includes('duplicate') || errStr.includes('possible')) {
      categorizedErrors.warning.push(err);
    } else if (errStr.includes('error') || errStr.includes('failed') || errStr.includes('cannot')) {
      categorizedErrors.critical.push(err);
    } else {
      categorizedErrors.info.push(err);
    }
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={32} />
            <div>
              <h2 className="text-2xl font-bold">Error Report</h2>
              <p className="text-sm text-red-100">
                {errors.length} issue{errors.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-800 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Summary */}
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categorizedErrors.critical.length > 0 && (
              <div className="text-center">
                <p className="text-xs text-red-600">Critical</p>
                <p className="text-2xl font-bold text-red-900">{categorizedErrors.critical.length}</p>
              </div>
            )}
            {categorizedErrors.validation.length > 0 && (
              <div className="text-center">
                <p className="text-xs text-orange-600">Validation</p>
                <p className="text-2xl font-bold text-orange-900">{categorizedErrors.validation.length}</p>
              </div>
            )}
            {categorizedErrors.warning.length > 0 && (
              <div className="text-center">
                <p className="text-xs text-yellow-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-900">{categorizedErrors.warning.length}</p>
              </div>
            )}
            {categorizedErrors.info.length > 0 && (
              <div className="text-center">
                <p className="text-xs text-blue-600">Info</p>
                <p className="text-2xl font-bold text-blue-900">{categorizedErrors.info.length}</p>
              </div>
            )}
          </div>
        </div>

        {/* Error List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Critical Errors */}
            {categorizedErrors.critical.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
                  <XCircle size={20} />
                  Critical Errors
                </h3>
                <div className="space-y-2">
                  {categorizedErrors.critical.map((err, idx) => (
                    <div key={idx} className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                      <p className="text-red-800 font-medium">
                        {typeof err === 'string' ? err : err.message || err.error || JSON.stringify(err)}
                      </p>
                      {typeof err === 'object' && err.details && (
                        <p className="text-sm text-red-600 mt-2">{err.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Errors */}
            {categorizedErrors.validation.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-orange-900 mb-3 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Validation Issues
                </h3>
                <div className="space-y-2">
                  {categorizedErrors.validation.map((err, idx) => (
                    <div key={idx} className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                      <p className="text-orange-800 font-medium">
                        {typeof err === 'string' ? err : err.message || err.error || JSON.stringify(err)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {categorizedErrors.warning.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-yellow-900 mb-3 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Warnings
                </h3>
                <div className="space-y-2">
                  {categorizedErrors.warning.map((err, idx) => (
                    <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                      <p className="text-yellow-800">
                        {typeof err === 'string' ? err : err.message || err.error || JSON.stringify(err)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info */}
            {categorizedErrors.info.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <Info size={20} />
                  Information
                </h3>
                <div className="space-y-2">
                  {categorizedErrors.info.map((err, idx) => (
                    <div key={idx} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                      <p className="text-blue-800">
                        {typeof err === 'string' ? err : err.message || err.error || JSON.stringify(err)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Copy size={18} />
            Copy Errors
          </button>
          <button
            onClick={downloadErrors}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Download size={18} />
            Download
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Close
          </button>
        </div>

        {/* Help Text */}
        <div className="p-4 bg-blue-50 border-t border-blue-200 text-sm text-blue-800">
          <p><strong>💡 Tips:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Fix critical errors first (red)</li>
            <li>Validation issues indicate data problems (orange)</li>
            <li>Warnings can often be ignored but should be reviewed (yellow)</li>
            <li>Use "Copy" or "Download" to share errors with support</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
