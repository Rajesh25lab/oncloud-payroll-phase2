import React, { useState, useMemo } from 'react';
import { Plus, Upload, Download, Trash2, Edit, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useVendors } from '../hooks/useVendors';
import { useEmployees } from '../hooks/useEmployees';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { hasPermission } from '../utils/enterpriseUtils';
import Paginator from '../components/common/Paginator';

const MasterData = ({ showErrors }) => {
  const { currentUser } = useAuth();
  const { vendors, addVendor, updateVendor, deleteVendor } = useVendors();
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useEmployees();

  const [showVendorForm, setShowVendorForm] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Search states
  const [vendorSearch, setVendorSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Debounced search (only filters after 300ms of no typing)
  const debouncedVendorSearch = useDebounce(vendorSearch, 300);
  const debouncedEmployeeSearch = useDebounce(employeeSearch, 300);

  // Filter vendors based on search
  const filteredVendors = useMemo(() => {
    const vendorList = Object.values(vendors);
    if (!debouncedVendorSearch) return vendorList;
    
    const searchLower = debouncedVendorSearch.toLowerCase();
    return vendorList.filter(vendor => 
      vendor.name.toLowerCase().includes(searchLower) ||
      vendor.bank.toLowerCase().includes(searchLower) ||
      vendor.ifsc.toLowerCase().includes(searchLower)
    );
  }, [vendors, debouncedVendorSearch]);

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    const employeeList = Object.values(employees);
    if (!debouncedEmployeeSearch) return employeeList;
    
    const searchLower = debouncedEmployeeSearch.toLowerCase();
    return employeeList.filter(emp =>
      emp.name.toLowerCase().includes(searchLower) ||
      emp.empId.toLowerCase().includes(searchLower) ||
      (emp.department && emp.department.toLowerCase().includes(searchLower))
    );
  }, [employees, debouncedEmployeeSearch]);

  // Pagination for vendors (50 per page)
  const {
    paginatedItems: paginatedVendors,
    currentPage: vendorPage,
    totalPages: vendorTotalPages,
    totalItems: vendorTotalItems,
    itemsPerPage: vendorItemsPerPage,
    goToPage: goToVendorPage
  } = usePagination(filteredVendors, 50);

  // Pagination for employees (50 per page)
  const {
    paginatedItems: paginatedEmployees,
    currentPage: employeePage,
    totalPages: employeeTotalPages,
    totalItems: employeeTotalItems,
    itemsPerPage: employeeItemsPerPage,
    goToPage: goToEmployeePage
  } = usePagination(filteredEmployees, 50);

  const [vendorForm, setVendorForm] = useState({
    name: '', bank: '', ifsc: '', accountNo: '', branch: '', status: 'Active'
  });

  const [employeeForm, setEmployeeForm] = useState({
    empId: '', name: '', department: '', designation: '',
    bankName: '', ifsc: '', accountNo: '', branch: '', accountType: 'Saving'
  });

  const handleAddVendor = () => {
    const result = editingVendor 
      ? updateVendor(editingVendor, vendorForm)
      : addVendor(vendorForm);

    if (result.success) {
      alert(`✅ Vendor ${editingVendor ? 'updated' : 'added'} successfully!`);
      setVendorForm({ name: '', bank: '', ifsc: '', accountNo: '', branch: '', status: 'Active' });
      setShowVendorForm(false);
      setEditingVendor(null);
    } else {
      showErrors([result.message]);
    }
  };

  const handleEditVendor = (vendor) => {
    setEditingVendor(vendor.id);
    setVendorForm({
      name: vendor.name,
      bank: vendor.bank,
      ifsc: vendor.ifsc,
      accountNo: vendor.accountNo,
      branch: vendor.branch || '',
      status: vendor.status || 'Active'
    });
    setShowVendorForm(true);
  };

  const handleDeleteVendor = (vendorId) => {
    const vendor = vendors[vendorId];
    if (!window.confirm(`Delete vendor "${vendor.name}"?`)) return;
    
    const result = deleteVendor(vendorId);
    if (result.success) {
      alert('✅ Vendor deleted!');
    } else {
      showErrors([result.message]);
    }
  };

  const handleAddEmployee = () => {
    const result = editingEmployee
      ? updateEmployee(editingEmployee, employeeForm)
      : addEmployee(employeeForm);

    if (result.success) {
      alert(`✅ Employee ${editingEmployee ? 'updated' : 'added'} successfully!`);
      setEmployeeForm({ 
        empId: '', name: '', department: '', designation: '',
        bankName: '', ifsc: '', accountNo: '', branch: '', accountType: 'Saving'
      });
      setShowEmployeeForm(false);
      setEditingEmployee(null);
    } else {
      showErrors([result.message]);
    }
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee.empId);
    setEmployeeForm({
      empId: employee.empId,
      name: employee.name,
      department: employee.department || '',
      designation: employee.designation || '',
      bankName: employee.bankName,
      ifsc: employee.ifsc,
      accountNo: employee.accountNo,
      branch: employee.branch || '',
      accountType: employee.accountType || 'Saving'
    });
    setShowEmployeeForm(true);
  };

  const handleDeleteEmployee = (empId) => {
    const employee = employees[empId];
    if (!window.confirm(`Delete employee "${employee.name}"?`)) return;
    
    const result = deleteEmployee(empId);
    if (result.success) {
      alert('✅ Employee deleted!');
    } else {
      showErrors([result.message]);
    }
  };

  const cancelEdit = () => {
    setEditingVendor(null);
    setEditingEmployee(null);
    setShowVendorForm(false);
    setShowEmployeeForm(false);
    setVendorForm({ name: '', bank: '', ifsc: '', accountNo: '', branch: '', status: 'Active' });
    setEmployeeForm({ 
      empId: '', name: '', department: '', designation: '',
      bankName: '', ifsc: '', accountNo: '', branch: '', accountType: 'Saving'
    });
  };

  return (
    <div className="space-y-6">
      {/* Vendors Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Vendors ({Object.keys(vendors).length})</h2>
          {hasPermission(currentUser, 'create', 'vendor') && (
            <button
              onClick={() => { setEditingVendor(null); setShowVendorForm(!showVendorForm); }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus size={18} />
              Add Vendor
            </button>
          )}
        </div>

        {showVendorForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-lg mb-4">
              {editingVendor ? '✏️ Edit Vendor' : '➕ Add New Vendor'}
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({...vendorForm, name: e.target.value})}
                  placeholder="Vendor name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={vendorForm.bank}
                  onChange={(e) => setVendorForm({...vendorForm, bank: e.target.value})}
                  placeholder="Bank name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  IFSC Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={vendorForm.ifsc}
                  onChange={(e) => setVendorForm({...vendorForm, ifsc: e.target.value.toUpperCase()})}
                  placeholder="IFSC"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={vendorForm.accountNo}
                  onChange={(e) => setVendorForm({...vendorForm, accountNo: e.target.value})}
                  placeholder="Account number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
                <input
                  type="text"
                  value={vendorForm.branch}
                  onChange={(e) => setVendorForm({...vendorForm, branch: e.target.value})}
                  placeholder="Branch name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={vendorForm.status}
                  onChange={(e) => setVendorForm({...vendorForm, status: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleAddVendor}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
              >
                ✓ {editingVendor ? 'Update' : 'Save'} Vendor
              </button>
              <button
                onClick={cancelEdit}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={vendorSearch}
              onChange={(e) => setVendorSearch(e.target.value)}
              placeholder="Search vendors by name, bank, or IFSC..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          {vendorSearch && (
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''} 
              {filteredVendors.length < Object.keys(vendors).length && ` (filtered from ${Object.keys(vendors).length} total)`}
            </p>
          )}
        </div>

        {/* Vendor List */}
        <div className="space-y-2">
          {paginatedVendors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {vendorSearch ? 'No vendors found matching your search' : 'No vendors added yet'}
            </div>
          ) : (
            paginatedVendors.map(vendor => (
              <div key={vendor.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold">{vendor.name}</p>
                    <p className="text-xs text-gray-500">{vendor.bank} - {vendor.ifsc} - {vendor.accountNo}</p>
                    {vendor.branch && <p className="text-xs text-gray-400">Branch: {vendor.branch}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      vendor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                    }`}>
                      {vendor.status}
                    </span>
                    {hasPermission(currentUser, 'edit', 'vendor') && (
                      <button
                        onClick={() => handleEditVendor(vendor)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {hasPermission(currentUser, 'delete', 'vendor') && (
                      <button
                        onClick={() => handleDeleteVendor(vendor.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredVendors.length > vendorItemsPerPage && (
          <Paginator
            currentPage={vendorPage}
            totalPages={vendorTotalPages}
            onPageChange={goToVendorPage}
            itemsPerPage={vendorItemsPerPage}
            totalItems={vendorTotalItems}
          />
        )}
      </div>

      {/* Employees Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Employees ({Object.keys(employees).length})</h2>
          {hasPermission(currentUser, 'create', 'employee') && (
            <button
              onClick={() => { setEditingEmployee(null); setShowEmployeeForm(!showEmployeeForm); }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus size={18} />
              Add Employee
            </button>
          )}
        </div>

        {showEmployeeForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-lg mb-4">
              {editingEmployee ? '✏️ Edit Employee' : '➕ Add New Employee'}
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Emp ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={employeeForm.empId}
                  onChange={(e) => setEmployeeForm({...employeeForm, empId: e.target.value})}
                  placeholder="E0001"
                  disabled={editingEmployee !== null}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({...employeeForm, name: e.target.value})}
                  placeholder="Employee name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  value={employeeForm.department}
                  onChange={(e) => setEmployeeForm({...employeeForm, department: e.target.value})}
                  placeholder="Department"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
                <input
                  type="text"
                  value={employeeForm.designation}
                  onChange={(e) => setEmployeeForm({...employeeForm, designation: e.target.value})}
                  placeholder="Designation"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={employeeForm.bankName}
                  onChange={(e) => setEmployeeForm({...employeeForm, bankName: e.target.value})}
                  placeholder="Bank name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  IFSC Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={employeeForm.ifsc}
                  onChange={(e) => setEmployeeForm({...employeeForm, ifsc: e.target.value.toUpperCase()})}
                  placeholder="IFSC"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={employeeForm.accountNo}
                  onChange={(e) => setEmployeeForm({...employeeForm, accountNo: e.target.value})}
                  placeholder="Account number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
                <input
                  type="text"
                  value={employeeForm.branch}
                  onChange={(e) => setEmployeeForm({...employeeForm, branch: e.target.value})}
                  placeholder="Branch name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Account Type</label>
                <select
                  value={employeeForm.accountType}
                  onChange={(e) => setEmployeeForm({...employeeForm, accountType: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Saving">Saving</option>
                  <option value="Current">Current</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleAddEmployee}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
              >
                ✓ {editingEmployee ? 'Update' : 'Save'} Employee
              </button>
              <button
                onClick={cancelEdit}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              placeholder="Search employees by name, ID, or department..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          {employeeSearch && (
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
              {filteredEmployees.length < Object.keys(employees).length && ` (filtered from ${Object.keys(employees).length} total)`}
            </p>
          )}
        </div>

        {/* Employee List */}
        <div className="space-y-2">
          {paginatedEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {employeeSearch ? 'No employees found matching your search' : 'No employees added yet'}
            </div>
          ) : (
            paginatedEmployees.map(employee => (
              <div key={employee.empId} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold">{employee.empId} - {employee.name}</p>
                    <p className="text-xs text-gray-500">
                      {employee.department || 'No dept'} {employee.designation ? `- ${employee.designation}` : ''}
                    </p>
                    <p className="text-xs text-gray-500">
                      {employee.bankName} - {employee.ifsc} - {employee.accountNo}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasPermission(currentUser, 'edit', 'employee') && (
                      <button
                        onClick={() => handleEditEmployee(employee)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {hasPermission(currentUser, 'delete', 'employee') && (
                      <button
                        onClick={() => handleDeleteEmployee(employee.empId)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredEmployees.length > employeeItemsPerPage && (
          <Paginator
            currentPage={employeePage}
            totalPages={employeeTotalPages}
            onPageChange={goToEmployeePage}
            itemsPerPage={employeeItemsPerPage}
            totalItems={employeeTotalItems}
          />
        )}
      </div>
    </div>
  );
};

export default MasterData;
