// Audit logging utilities for enterprise-grade tracking

// Generate audit log entry
export const createAuditLog = (user, action, resource, resourceId, before = null, after = null, metadata = {}) => {
  const timestamp = new Date().toISOString();
  
  // Calculate what changed
  const changes = [];
  if (before && after) {
    Object.keys(after).forEach(key => {
      if (before[key] !== after[key] && key !== 'lastModified' && key !== 'addedDate') {
        changes.push(`${key}: ${before[key]} → ${after[key]}`);
      }
    });
  }
  
  return {
    logId: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp,
    userId: user.username,
    userName: user.name,
    userRole: user.role,
    action,
    category: getCategoryFromAction(action),
    resource,
    resourceId,
    before,
    after,
    changes,
    success: true,
    metadata
  };
};

// Get category from action
const getCategoryFromAction = (action) => {
  if (action.includes('login') || action.includes('logout')) return 'auth';
  if (action.includes('approved') || action.includes('rejected')) return 'approval';
  if (action.includes('upload') || action.includes('download') || action.includes('export')) return 'file';
  if (action.includes('created') || action.includes('updated') || action.includes('deleted')) return 'data';
  return 'system';
};

// Create file log entry
export const createFileLog = (user, operation, file, metadata = {}) => {
  return {
    fileId: `FILE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    fileName: file.name || metadata.fileName,
    fileType: metadata.type || 'unknown',
    fileSize: file.size || 0,
    uploadedBy: user.username,
    uploadedByName: user.name,
    uploadedDate: new Date().toISOString(),
    action: operation, // 'upload', 'download', 'export'
    status: metadata.status || 'completed',
    rowCount: metadata.rowCount || 0,
    validRows: metadata.validRows || 0,
    errorRows: metadata.errorRows || 0,
    errors: metadata.errors || [],
    processedDate: metadata.status === 'processed' ? new Date().toISOString() : null,
    metadata: metadata
  };
};

// Permission definitions
export const PERMISSIONS = {
  admin: ['*'], // All permissions
  manager: [
    'expense:create', 'expense:read', 'expense:approve', 'expense:reject',
    'vendor:read', 'employee:read',
    'file:upload', 'file:download', 'file:view_own', 'file:export_own',
    'audit:view_own'
  ],
  user: [
    'expense:create', 'expense:read_own',
    'vendor:read', 'employee:read',
    'file:upload', 'file:download_template'
  ]
};

// Check if user has permission
export const hasPermission = (user, resource, action) => {
  if (!user || !user.role) return false;
  
  const userPermissions = PERMISSIONS[user.role] || [];
  
  // Admin has all permissions
  if (userPermissions.includes('*')) return true;
  
  // Check specific permission
  const permission = `${resource}:${action}`;
  return userPermissions.includes(permission);
};

// Format audit log for display
export const formatAuditLog = (log) => {
  const actionLabels = {
    'login': '🔐 User Login',
    'logout': '🚪 User Logout',
    'expense_created': '➕ Expense Created',
    'expense_approved': '✅ Expense Approved',
    'expense_rejected': '❌ Expense Rejected',
    'vendor_created': '🏢 Vendor Added',
    'vendor_updated': '📝 Vendor Updated',
    'employee_created': '👤 Employee Added',
    'employee_updated': '📝 Employee Updated',
    'file_uploaded': '📤 File Uploaded',
    'file_downloaded': '📥 File Downloaded',
    'permission_denied': '🚫 Permission Denied'
  };
  
  return {
    ...log,
    actionLabel: actionLabels[log.action] || log.action,
    timeAgo: getTimeAgo(log.timestamp)
  };
};

// Get time ago string
const getTimeAgo = (timestamp) => {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now - then) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};

// Filter audit logs
export const filterAuditLogs = (logs, filters) => {
  return logs.filter(log => {
    if (filters.user && log.userId !== filters.user) return false;
    if (filters.category && log.category !== filters.category) return false;
    if (filters.resource && log.resource !== filters.resource) return false;
    if (filters.action && log.action !== filters.action) return false;
    if (filters.dateFrom && new Date(log.timestamp) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(log.timestamp) > new Date(filters.dateTo)) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return log.resourceId?.toLowerCase().includes(searchLower) ||
             log.userName?.toLowerCase().includes(searchLower) ||
             log.action?.toLowerCase().includes(searchLower);
    }
    return true;
  });
};

// Filter file logs
export const filterFileLogs = (logs, filters) => {
  return logs.filter(log => {
    if (filters.user && log.uploadedBy !== filters.user) return false;
    if (filters.type && log.fileType !== filters.type) return false;
    if (filters.status && log.status !== filters.status) return false;
    if (filters.action && log.action !== filters.action) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return log.fileName?.toLowerCase().includes(searchLower);
    }
    return true;
  });
};

// Export audit logs to CSV
export const exportAuditLogToCSV = (logs) => {
  const headers = ['Timestamp', 'User', 'Role', 'Action', 'Resource', 'Resource ID', 'Changes', 'Status'];
  const rows = logs.map(log => [
    new Date(log.timestamp).toLocaleString(),
    log.userName,
    log.userRole,
    log.action,
    log.resource || '',
    log.resourceId || '',
    log.changes.join('; '),
    log.success ? 'Success' : 'Failed'
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csv;
};

// Export file logs to CSV
export const exportFileLogToCSV = (logs) => {
  const headers = ['Date', 'File Name', 'Type', 'Size', 'Uploaded By', 'Rows', 'Valid', 'Errors', 'Status'];
  const rows = logs.map(log => [
    new Date(log.uploadedDate).toLocaleString(),
    log.fileName,
    log.fileType,
    `${(log.fileSize / 1024).toFixed(2)} KB`,
    log.uploadedByName,
    log.rowCount,
    log.validRows,
    log.errorRows,
    log.status
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csv;
};
