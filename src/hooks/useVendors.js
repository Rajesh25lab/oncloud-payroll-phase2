import { useApp } from '../contexts/AppContext';
import { logAudit, requirePermission } from '../utils/enterpriseUtils';
import { generateId } from '../utils/exportUtils';

export const useVendors = () => {
  const { 
    currentUser, 
    masterData, 
    setMasterData, 
    auditLogs, 
    setAuditLogs 
  } = useApp();

  // Add vendor
  const addVendor = (vendorData) => {
    if (!requirePermission(currentUser, 'create', 'vendor')) {
      logAudit(auditLogs, setAuditLogs, 'permission_denied', 'vendor', null, null,
        { action: 'create' }, currentUser, false, 'Insufficient permissions');
      return { success: false, message: 'Insufficient permissions' };
    }

    const { name, bank, ifsc, accountNo } = vendorData;

    if (!name || !bank || !ifsc || !accountNo) {
      return { success: false, message: 'Please fill in all required fields' };
    }

    const vendorId = generateId('VEN');
    const newVendors = { ...masterData.vendors };

    newVendors[vendorId] = {
      id: vendorId,
      ...vendorData,
      ifsc: ifsc.toUpperCase(),
      type: 'vendor',
      addedDate: new Date().toISOString(),
      source: 'manual_entry'
    };

    setMasterData({ ...masterData, vendors: newVendors });

    // Log audit
    logAudit(auditLogs, setAuditLogs, 'vendor_created', 'vendor', vendorId,
      null, newVendors[vendorId], currentUser);

    return { success: true, vendor: newVendors[vendorId] };
  };

  // Update vendor
  const updateVendor = (vendorId, vendorData) => {
    if (!requirePermission(currentUser, 'edit', 'vendor')) {
      logAudit(auditLogs, setAuditLogs, 'permission_denied', 'vendor', vendorId, null,
        { action: 'edit' }, currentUser, false, 'Insufficient permissions');
      return { success: false, message: 'Insufficient permissions' };
    }

    const { name, bank, ifsc, accountNo } = vendorData;

    if (!name || !bank || !ifsc || !accountNo) {
      return { success: false, message: 'Please fill in all required fields' };
    }

    const oldVendor = masterData.vendors[vendorId];
    if (!oldVendor) {
      return { success: false, message: 'Vendor not found' };
    }

    const newVendors = { ...masterData.vendors };

    newVendors[vendorId] = {
      ...oldVendor,
      ...vendorData,
      ifsc: ifsc.toUpperCase(),
      lastModified: new Date().toISOString(),
      modifiedBy: currentUser.username
    };

    setMasterData({ ...masterData, vendors: newVendors });

    // Log audit
    logAudit(auditLogs, setAuditLogs, 'vendor_updated', 'vendor', vendorId,
      oldVendor, newVendors[vendorId], currentUser);

    return { success: true, vendor: newVendors[vendorId] };
  };

  // Delete vendor
  const deleteVendor = (vendorId) => {
    if (!requirePermission(currentUser, 'delete', 'vendor')) {
      logAudit(auditLogs, setAuditLogs, 'permission_denied', 'vendor', vendorId, null,
        { action: 'delete' }, currentUser, false, 'Insufficient permissions');
      return { success: false, message: 'Insufficient permissions' };
    }

    const vendor = masterData.vendors[vendorId];
    if (!vendor) {
      return { success: false, message: 'Vendor not found' };
    }

    const newVendors = { ...masterData.vendors };
    delete newVendors[vendorId];

    setMasterData({ ...masterData, vendors: newVendors });

    // Log audit
    logAudit(auditLogs, setAuditLogs, 'vendor_deleted', 'vendor', vendorId,
      vendor, null, currentUser);

    return { success: true };
  };

  return {
    vendors: masterData.vendors,
    addVendor,
    updateVendor,
    deleteVendor
  };
};
