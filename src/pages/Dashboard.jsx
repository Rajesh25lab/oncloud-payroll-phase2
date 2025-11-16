import React from 'react';
import { Users, Receipt, DollarSign, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const Dashboard = () => {
  const { masterData, expenses, pendingDuplicates } = useApp();

  const stats = [
    {
      label: 'Total Employees',
      value: Object.keys(masterData.employees).length,
      icon: Users,
      color: 'blue'
    },
    {
      label: 'Total Vendors',
      value: Object.keys(masterData.vendors).length,
      icon: FileText,
      color: 'green'
    },
    {
      label: 'Total Expenses',
      value: expenses.length,
      icon: Receipt,
      color: 'purple'
    },
    {
      label: 'Pending Expenses',
      value: expenses.filter(e => e.status === 'pending').length,
      icon: AlertCircle,
      color: 'orange'
    },
    {
      label: 'Approved Expenses',
      value: expenses.filter(e => e.status === 'approved').length,
      icon: TrendingUp,
      color: 'emerald'
    },
    {
      label: 'Total Expense Amount',
      value: `₹${expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'indigo'
    }
  ];

  const pendingApprovals = pendingDuplicates.vendors.length + pendingDuplicates.employees.length;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-2">Welcome to On Cloud Payroll</h2>
        <p className="text-blue-100">
          Enterprise-grade payroll management system with automated workflows
        </p>
      </div>

      {/* Pending Approvals Alert */}
      {pendingApprovals > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3">
            <AlertCircle size={32} />
            <div>
              <h3 className="text-xl font-bold">Pending Approvals Required</h3>
              <p className="text-orange-100">
                You have {pendingApprovals} duplicate record(s) waiting for admin review in Master Data
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`text-${stat.color}-600`} size={24} />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-semibold mb-1">{stat.label}</h3>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 transition cursor-pointer">
            <Receipt className="text-blue-600 mb-2" size={24} />
            <h4 className="font-semibold text-gray-800">Add Expense</h4>
            <p className="text-sm text-gray-600">Record new expense</p>
          </div>
          <div className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 transition cursor-pointer">
            <Users className="text-green-600 mb-2" size={24} />
            <h4 className="font-semibold text-gray-800">Add Employee</h4>
            <p className="text-sm text-gray-600">Register new employee</p>
          </div>
          <div className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 transition cursor-pointer">
            <FileText className="text-purple-600 mb-2" size={24} />
            <h4 className="font-semibold text-gray-800">Add Vendor</h4>
            <p className="text-sm text-gray-600">Register new vendor</p>
          </div>
          <div className="p-4 border-2 border-orange-200 rounded-lg hover:border-orange-400 transition cursor-pointer">
            <TrendingUp className="text-orange-600 mb-2" size={24} />
            <h4 className="font-semibold text-gray-800">View Reports</h4>
            <p className="text-sm text-gray-600">Audit trail & logs</p>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">System Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Features</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>✅ Smart Duplicate Handling</li>
              <li>✅ Bulk Import with Validation</li>
              <li>✅ Admin Approval Workflows</li>
              <li>✅ Full Audit Trail</li>
              <li>✅ Permission-Based Access</li>
              <li>✅ Edit/Delete Master Data</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Security</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>🔒 Role-Based Access Control</li>
              <li>🔒 Complete Audit Logging</li>
              <li>🔒 Local Data Storage</li>
              <li>🔒 Permission Validation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
