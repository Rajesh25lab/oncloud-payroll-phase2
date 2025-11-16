import React, { useState } from 'react';
import { Search, Download, Filter } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const AuditLog = () => {
  const { auditLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const filteredLogs = auditLogs
    .filter(log => {
      if (filterAction !== 'all' && log.action !== filterAction) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          log.action.toLowerCase().includes(search) ||
          log.resource.toLowerCase().includes(search) ||
          log.performedByName.toLowerCase().includes(search)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const uniqueActions = [...new Set(auditLogs.map(log => log.action))];

  const getActionColor = (action) => {
    if (action.includes('created')) return 'text-green-600 bg-green-50';
    if (action.includes('deleted')) return 'text-red-600 bg-red-50';
    if (action.includes('updated')) return 'text-blue-600 bg-blue-50';
    if (action.includes('approved')) return 'text-emerald-600 bg-emerald-50';
    if (action.includes('rejected')) return 'text-orange-600 bg-orange-50';
    return 'text-gray-600 bg-gray-50';
  };

  const exportAuditLog = () => {
    const csv = [
      ['Timestamp', 'Action', 'Resource', 'Resource ID', 'Performed By', 'Success'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.action,
        log.resource,
        log.resourceId || 'N/A',
        log.performedByName,
        log.success ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Audit Trail</h2>
            <p className="text-gray-600 mt-1">Complete history of all system actions</p>
          </div>
          <button
            onClick={exportAuditLog}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Search size={16} className="inline mr-2" />
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search action, resource, or user..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Filter size={16} className="inline mr-2" />
              Filter by Action
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Events</p>
          <p className="text-2xl font-bold">{auditLogs.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Filtered</p>
          <p className="text-2xl font-bold">{filteredLogs.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Successful</p>
          <p className="text-2xl font-bold text-green-600">
            {auditLogs.filter(l => l.success).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Failed</p>
          <p className="text-2xl font-bold text-red-600">
            {auditLogs.filter(l => !l.success).length}
          </p>
        </div>
      </div>

      {/* Audit Log List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Audit Entries ({filteredLogs.length})
        </h3>
        
        {filteredLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No audit entries found</p>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredLogs.map((log, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-lg font-semibold text-sm ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-sm text-gray-600">
                        {log.resource} {log.resourceId ? `(${log.resourceId})` : ''}
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <p>
                        <strong>User:</strong> {log.performedByName} ({log.performedBy})
                      </p>
                      <p>
                        <strong>Time:</strong> {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                          View Details
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <div>
                    {log.success ? (
                      <span className="text-green-600 font-semibold text-sm">✓ Success</span>
                    ) : (
                      <span className="text-red-600 font-semibold text-sm">✗ Failed</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
