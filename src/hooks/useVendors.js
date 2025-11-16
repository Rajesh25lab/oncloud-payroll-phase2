import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useAudit } from '../contexts/AuditContext';
import { requirePermission } from '../utils/enterpriseUtils';
import { generateId } from '../utils/exportUtils';

export const useVendors = () => {
  const { currentUser } = useAuth();
  const { vendors, dispatch: dataDispatch } = useData();
  const { logAudit } = useAudit();

  // Add vendor
  const addVendor = (vendorData) => {
    if (!requirePermission(currentUser, 'create', 'vendor')) {
      logAudit({
        action: 'permission_denied',
        resource: 'vendor',
        resourceId: null,
        performedBy: currentUser?.username || 'unknown',
        performedByName: currentUser?.name || 'Unknown',
        metadata: { action: 'create' },
        success: false,
        errorMessage: 'Insufficient permissions'
      });
      return { success: false, message: 'Insufficient permissions' };
    }

    const { name, bank, ifsc, accountNo } = vendorData;

    if (!name || !bank || !ifsc || !accountNo) {
      return { success: false, message: 'Please fill in all required fields' };
    }

    const vendorId = generateId('VEN');
    const newVendor = {
      id: vendorId,
      ...vendorData,
      ifsc: ifsc.toUpperCase(),
      type: 'vendor',
      addedDate: new Date().toISOString(),
      source: 'manual_entry'
    };

    dataDispatch({ type: 'ADD_VENDOR', payload: newVendor });

    // Log audit
    logAudit({
      action: 'vendor_created',
      resource: 'vendor',
      resourceId: vendorId,
      performedBy: currentUser.username,
      performedByName: currentUser.name,
      metadata: newVendor,
      success: true
    });

    return { success: true, vendor: newVendor };
  };

  // Update vendor
  const updateVendor = (vendorId, vendorData) => {
    if (!requirePermission(currentUser, 'edit', 'vendor')) {
      logAudit({
        action: 'permission_denied',
        resource: 'vendor',
        resourceId: vendorId,
        performedBy: currentUser?.username || 'unknown',
        performedByName: currentUser?.name || 'Unknown',
        metadata: { action: 'edit' },
        success: false,
        errorMessage: 'Insufficient permissions'
      });
      return { success: false, message: 'Insufficient permissions' };
    }

    const { name, bank, ifsc, accountNo } = vendorData;

    if (!name || !bank || !ifsc || !accountNo) {
      return { success: false, message: 'Please fill in all required fields' };
    }

    const oldVendor = vendors[vendorId];
    if (!oldVendor) {
      return { success: false, message: 'Vendor not found' };
    }

    const updatedVendor = {
      ...oldVendor,
      ...vendorData,
      ifsc: ifsc.toUpperCase(),
      lastModified: new Date().toISOString(),
      modifiedBy: currentUser.username
    };

    dataDispatch({ type: 'UPDATE_VENDOR', payload: updatedVendor });

    // Log audit
    logAudit({
      action: 'vendor_updated',
      resource: 'vendor',
      resourceId: vendorId,
      performedBy: currentUser.username,
      performedByName: currentUser.name,
      metadata: { old: oldVendor, new: updatedVendor },
      success: true
    });

    return { success: true, vendor: updatedVendor };
  };

  // Delete vendor
  const deleteVendor = (vendorId) => {
    if (!requirePermission(currentUser, 'delete', 'vendor')) {
      logAudit({
        action: 'permission_denied',
        resource: 'vendor',
        resourceId: vendorId,
        performedBy: currentUser?.username || 'unknown',
        performedByName: currentUser?.name || 'Unknown',
        metadata: { action: 'delete' },
        success: false,
        errorMessage: 'Insufficient permissions'
      });
      return { success: false, message: 'Insufficient permissions' };
    }

    const vendor = vendors[vendorId];
    if (!vendor) {
      return { success: false, message: 'Vendor not found' };
    }

    dataDispatch({ type: 'DELETE_VENDOR', payload: vendorId });

    // Log audit
    logAudit({
      action: 'vendor_deleted',
      resource: 'vendor',
      resourceId: vendorId,
      performedBy: currentUser.username,
      performedByName: currentUser.name,
      metadata: vendor,
      success: true
    });

    return { success: true };
  };

  return {
    vendors,
    addVendor,
    updateVendor,
    deleteVendor
  };
};
