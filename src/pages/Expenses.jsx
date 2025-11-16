import React, { useState } from 'react';
import { Plus, Upload, CheckCircle, XCircle, Trash2, Camera, Download } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useExpenses } from '../hooks/useExpenses';
import { hasPermission } from '../utils/enterpriseUtils';

const Expenses = () => {
  const { currentUser, masterData, showErrors } = useApp();
  const { 
    pendingExpenses, 
    approvedExpenses, 
    rejectedExpenses,
    addExpense, 
    approveExpense, 
    rejectExpense, 
    deleteExpense 
  } = useExpenses();

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [receiptProcessing, setReceiptProcessing] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Petrol',
    payeeName: '',
    payeeType: 'vendor',
    amount: '',
    category: 'Operating',
    description: '',
    receiptImage: null
  });

  const expenseTypes = [
    'Petrol', 'Advance', 'Loan', 'Overtime', 'Rent', 'Interest',
    'Wages', 'Salary', 'Payment', 'Cutting Charges', 'Stitching Charges',
    'Cartage Account', 'Professional Fees'
  ];

  const handleAddExpense = () => {
    const { date, type, payeeName, amount } = expenseForm;

    if (!date || !type || !payeeName || !amount) {
      showErrors(['Please fill in all required fields: Date, Type, Payee Name, and Amount']);
      return;
    }

    if (parseFloat(amount) <= 0) {
      showErrors(['Amount must be greater than zero']);
      return;
    }

    const result = addExpense(expenseForm);

    if (result.success) {
      alert(`✅ Expense "${type}" for ₹${amount} added successfully!`);
      setExpenseForm({
        date: new Date().toISOString().split('T')[0],
        type: 'Petrol',
        payeeName: '',
        payeeType: 'vendor',
        amount: '',
        category: 'Operating',
        description: '',
        receiptImage: null
      });
      setShowExpenseForm(false);
    } else {
      showErrors([result.message || 'Failed to add expense']);
    }
  };

  const handleApprove = (expenseId) => {
    const result = approveExpense(expenseId);
    if (result.success) {
      alert('✅ Expense approved successfully!');
    } else {
      showErrors([result.message || 'Failed to approve expense']);
    }
  };

  const handleReject = (expenseId) => {
    const result = rejectExpense(expenseId);
    if (result.success) {
      alert('❌ Expense rejected successfully!');
    } else {
      showErrors([result.message || 'Failed to reject expense']);
    }
  };

  const handleDelete = (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    const result = deleteExpense(expenseId);
    if (result.success) {
      alert('🗑️ Expense deleted successfully!');
    } else {
      showErrors([result.message || 'Failed to delete expense']);
    }
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setReceiptProcessing(true);

    try {
      // Convert to base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setExpenseForm({
        ...expenseForm,
        receiptImage: base64Data
      });

      alert('✅ Receipt uploaded successfully!');
    } catch (error) {
      showErrors([`Error uploading receipt: ${error.message}`]);
    } finally {
      setReceiptProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Expenses</h2>
            <p className="text-gray-600 mt-1">Manage and track all expenses</p>
          </div>
          {hasPermission(currentUser, 'create', 'expense') && (
            <button
              onClick={() => setShowExpenseForm(!showExpenseForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={18} />
              Add Expense
            </button>
          )}
        </div>
      </div>

      {/* Add Expense Form */}
      {showExpenseForm && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">➕ Add New Expense</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Expense Type <span className="text-red-500">*</span>
              </label>
              <select
                value={expenseForm.type}
                onChange={(e) => setExpenseForm({...expenseForm, type: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {expenseTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payee Type <span className="text-red-500">*</span>
              </label>
              <select
                value={expenseForm.payeeType}
                onChange={(e) => setExpenseForm({...expenseForm, payeeType: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="vendor">Vendor</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payee Name <span className="text-red-500">*</span>
              </label>
              {expenseForm.payeeType === 'vendor' ? (
                <select
                  value={expenseForm.payeeName}
                  onChange={(e) => setExpenseForm({...expenseForm, payeeName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Vendor</option>
                  {Object.values(masterData.vendors).map(v => (
                    <option key={v.id} value={v.name}>{v.name}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={expenseForm.payeeName}
                  onChange={(e) => setExpenseForm({...expenseForm, payeeName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employee</option>
                  {Object.values(masterData.employees).map(emp => (
                    <option key={emp.empId} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Operating">Operating</option>
                <option value="Capital">Capital</option>
                <option value="Administrative">Administrative</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                placeholder="Enter expense description..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Receipt Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  disabled={receiptProcessing}
                  className="hidden"
                  id="receipt-upload"
                />
                <label
                  htmlFor="receipt-upload"
                  className="flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera size={20} className="text-gray-600" />
                  <span className="text-gray-600">
                    {receiptProcessing ? 'Processing...' : expenseForm.receiptImage ? 'Receipt Uploaded ✓' : 'Click to upload receipt'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleAddExpense}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              ✓ Save Expense
            </button>
            <button
              onClick={() => setShowExpenseForm(false)}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              ✕ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pending Expenses */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Pending Expenses ({pendingExpenses.length})
        </h3>
        
        {pendingExpenses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No pending expenses</p>
        ) : (
          <div className="space-y-3">
            {pendingExpenses.map(expense => (
              <div key={expense.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg font-semibold text-sm">
                        Pending
                      </span>
                      <span className="font-bold text-lg">{expense.type}</span>
                    </div>
                    <div className="grid md:grid-cols-3 gap-2 text-sm">
                      <p><strong>Date:</strong> {new Date(expense.date).toLocaleDateString()}</p>
                      <p><strong>Payee:</strong> {expense.payeeName}</p>
                      <p><strong>Amount:</strong> ₹{parseFloat(expense.amount).toFixed(2)}</p>
                    </div>
                    {expense.description && (
                      <p className="text-sm text-gray-600 mt-2">{expense.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Submitted by {expense.submittedByName} on {new Date(expense.submittedDate).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {hasPermission(currentUser, 'approve', 'expense') && (
                      <>
                        <button
                          onClick={() => handleApprove(expense.id)}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                          title="Approve"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => handleReject(expense.id)}
                          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                          title="Reject"
                        >
                          <XCircle size={18} />
                        </button>
                      </>
                    )}
                    {hasPermission(currentUser, 'delete', 'expense') && (
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Expenses */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Approved Expenses ({approvedExpenses.length})
        </h3>
        
        {approvedExpenses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No approved expenses</p>
        ) : (
          <div className="space-y-3">
            {approvedExpenses.map(expense => (
              <div key={expense.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg font-semibold text-sm">
                        Approved
                      </span>
                      <span className="font-bold text-lg">{expense.type}</span>
                    </div>
                    <div className="grid md:grid-cols-3 gap-2 text-sm">
                      <p><strong>Date:</strong> {new Date(expense.date).toLocaleDateString()}</p>
                      <p><strong>Payee:</strong> {expense.payeeName}</p>
                      <p><strong>Amount:</strong> ₹{parseFloat(expense.amount).toFixed(2)}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Approved by {expense.approvedByName} on {new Date(expense.approvedDate).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejected Expenses */}
      {rejectedExpenses.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Rejected Expenses ({rejectedExpenses.length})
          </h3>
          
          <div className="space-y-3">
            {rejectedExpenses.map(expense => (
              <div key={expense.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-lg font-semibold text-sm">
                        Rejected
                      </span>
                      <span className="font-bold text-lg">{expense.type}</span>
                    </div>
                    <div className="grid md:grid-cols-3 gap-2 text-sm">
                      <p><strong>Date:</strong> {new Date(expense.date).toLocaleDateString()}</p>
                      <p><strong>Payee:</strong> {expense.payeeName}</p>
                      <p><strong>Amount:</strong> ₹{parseFloat(expense.amount).toFixed(2)}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Rejected by {expense.rejectedByName} on {new Date(expense.rejectedDate).toLocaleString()}
                    </p>
                  </div>
                  {hasPermission(currentUser, 'delete', 'expense') && (
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
