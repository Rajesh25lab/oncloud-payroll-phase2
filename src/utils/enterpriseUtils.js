// Enterprise module utilities - File Management, Audit Logging, RBAC

// ==================== FILE MANAGEMENT ====================

// Log file operations (upload, download, export)
export const logFileOperation = (fileLogs, setFileLogs, operation, file, metadata, currentUser) => {
  const fileLog = {
    fileId: generateId('FILE'),
    fileName: file?.name || metadata.fileName,
    fileType: metadata.type, // 'expense_upload', 'vendor_import', 'employee_import', etc.
    fileSize: file?.size || 0,
    uploadedBy: currentUser.username,
    uploadedByName: currentUser.name,
    uploadedDate: new Date().toISOString(),
    action: operation, // 'upload', 'download', 'export'
    status: metadata.status || 'success',
    rowCount: metadata.rowCount || 0,
    validRows: metadata.validRows || 0,
    errorRows: metadata.errorRows || 0,
    errors: metadata.errors || [],
    processedDate: metadata.status === 'processed' ? new Date().toISOString() : null,
    metadata: metadata
  };
  
  const newFileLogs = [fileLog, ...fileLogs];
  setFileLogs(newFileLogs);
  return fileLog;
};

// Generate unique IDs for logs
const generateId = (prefix) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-${timestamp}-${random}`;
};

// Search/filter files
export const searchFiles = (fileLogs, searchTerm, filters) => {
  let filtered = [...fileLogs];
  
  // Search by filename or user
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(f => 
      f.fileName.toLowerCase().includes(term) ||
      f.uploadedByName.toLowerCase().includes(term)
    );
  }
  
  // Filter by type
  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter(f => f.fileType === filters.type);
  }
  
  // Filter by action
  if (filters.action && filters.action !== 'all') {
    filtered = filtered.filter(f => f.action === filters.action);
  }
  
  // Filter by status
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(f => f.status === filters.status);
  }
  
  // Filter by date range
  if (filters.dateFrom) {
    filtered = filtered.filter(f => new Date(f.uploadedDate) >= new Date(filters.dateFrom));
  }
  if (filters.dateTo) {
    filtered = filtered.filter(f => new Date(f.uploadedDate) <= new Date(filters.dateTo));
  }
  
  return filtered;
};

// ==================== AUDIT LOGGING ====================

// Log any action in the system
export const logAudit = (auditLogs, setAuditLogs, action, resource, resourceId, before, after, currentUser, success = true, errorMessage = null) => {
  const auditLog = {
    logId: generateId('LOG'),
    timestamp: new Date().toISOString(),
    userId: currentUser.username,
    userName: currentUser.name,
    userRole: currentUser.role,
    action: action, // 'expense_created', 'vendor_updated', 'login', 'file_uploaded', etc.
    category: getCategoryFromAction(action),
    resource: resource, // 'expense', 'vendor', 'employee', 'file', 'auth'
    resourceId: resourceId,
    before: before,
    after: after,
    changes: calculateChanges(before, after),
    success: success,
    errorMessage: errorMessage,
    ipAddress: 'localhost', // Browser can't get real IP
    userAgent: navigator.userAgent,
    metadata: {}
  };
  
  const newAuditLogs = [auditLog, ...auditLogs];
  setAuditLogs(newAuditLogs);
  return auditLog;
};

// Get category from action type
const getCategoryFromAction = (action) => {
  if (action.includes('login') || action.includes('logout')) return 'auth';
  if (action.includes('file') || action.includes('upload') || action.includes('download')) return 'file';
  if (action.includes('approved') || action.includes('rejected')) return 'approval';
  if (action.includes('created') || action.includes('updated') || action.includes('deleted')) return 'data';
  return 'system';
};

// Calculate what changed between before and after
const calculateChanges = (before, after) => {
  if (!before || !after) return [];
  
  const changes = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  
  allKeys.forEach(key => {
    if (before[key] !== after[key]) {
      changes.push(`${key}: ${before[key]} → ${after[key]}`);
    }
  });
  
  return changes;
};

// Search/filter audit logs
export const searchAuditLogs = (auditLogs, searchTerm, filters) => {
  let filtered = [...auditLogs];
  
  // Search by text
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(log => 
      log.userName.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.resourceId?.toLowerCase().includes(term)
    );
  }
  
  // Filter by user
  if (filters.user && filters.user !== 'all') {
    filtered = filtered.filter(log => log.userId === filters.user);
  }
  
  // Filter by category
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter(log => log.category === filters.category);
  }
  
  // Filter by resource
  if (filters.resource && filters.resource !== 'all') {
    filtered = filtered.filter(log => log.resource === filters.resource);
  }
  
  // Filter by date range
  if (filters.dateFrom) {
    filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.dateFrom));
  }
  if (filters.dateTo) {
    filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.dateTo));
  }
  
  return filtered;
};

// Export audit logs to CSV
export const exportAuditLogs = (logs) => {
  const headers = ['Timestamp', 'User', 'Role', 'Action', 'Category', 'Resource', 'Resource ID', 'Changes', 'Success', 'Error'];
  
  const rows = logs.map(log => [
    new Date(log.timestamp).toLocaleString(),
    log.userName,
    log.userRole,
    log.action,
    log.category,
    log.resource,
    log.resourceId || '',
    log.changes.join('; '),
    log.success ? 'Yes' : 'No',
    log.errorMessage || ''
  ].map(cell => `"${cell}"`).join(','));
  
  const csv = [headers.join(','), ...rows].join('\n');
  downloadCSV(csv, `Audit_Log_${new Date().toISOString().split('T')[0]}.csv`);
};

// Helper to download CSV
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

// ==================== RBAC (Role-Based Access Control) ====================

// Permission definitions
export const PERMISSIONS = {
  admin: ['*'], // All permissions
  manager: [
    'expense:create', 'expense:read', 'expense:update', 'expense:approve',
    'vendor:read', 'employee:read',
    'file:upload', 'file:download', 'file:view_own',
    'audit:view_own'
  ],
  user: [
    'expense:create', 'expense:read_own',
    'vendor:read', 'employee:read',
    'file:upload', 'file:download_template',
    'template:download'
  ]
};

// Check if user has permission
export const hasPermission = (user, action, resource) => {
  if (!user || !user.role) return false;
  
  const userPermissions = PERMISSIONS[user.role] || [];
  
  // Admin has all permissions
  if (userPermissions.includes('*')) return true;
  
  // Check specific permission
  const permission = `${resource}:${action}`;
  return userPermissions.includes(permission);
};

// Check permission and show error if denied
export const requirePermission = (user, action, resource, showAlert = true) => {
  const allowed = hasPermission(user, action, resource);
  
  if (!allowed && showAlert) {
    alert(`Permission Denied: You do not have permission to ${action} ${resource}.`);
  }
  
  return allowed;
};

// Get user's allowed actions for a resource
export const getAllowedActions = (user, resource) => {
  const userPermissions = PERMISSIONS[user.role] || [];
  
  if (userPermissions.includes('*')) {
    return ['create', 'read', 'update', 'delete', 'approve'];
  }
  
  const actions = [];
  userPermissions.forEach(perm => {
    const [permResource, action] = perm.split(':');
    if (permResource === resource) {
      actions.push(action);
    }
  });
  
  return actions;
};

// Role display names
export const ROLE_NAMES = {
  admin: 'Administrator',
  manager: 'Manager',
  user: 'User'
};

// Role descriptions
export const ROLE_DESCRIPTIONS = {
  admin: 'Full access to all features including master data, audit logs, and user management',
  manager: 'Can manage expenses, approve/reject, view master data (read-only)',
  user: 'Can add expenses and view master data (read-only)'
};

// Get category icon for audit logs
export const getCategoryIcon = (category) => {
  const icons = {
    auth: '🔐',
    data: '📝',
    file: '📁',
    approval: '✅',
    system: '⚙️'
  };
  return icons[category] || '📋';
};

// Get status color for files
export const getStatusColor = (status) => {
  const colors = {
    success: 'green',
    processed: 'green',
    error: 'red',
    partial: 'orange',
    pending: 'yellow'
  };
  return colors[status] || 'gray';
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Format relative time
export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};
