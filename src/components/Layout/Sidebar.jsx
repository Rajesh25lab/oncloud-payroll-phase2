import React from 'react';
import { Home, Receipt, Database, FileText, Users } from 'lucide-react';
import { useExpenseContext } from '../../contexts/ExpenseContext';

const Sidebar = ({ currentView, setCurrentView }) => {
  const { pendingExpenses } = useExpenseContext();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'expenses', label: 'Expenses', icon: Receipt, badge: pendingExpenses.length },
    { id: 'masterdata', label: 'Master Data', icon: Database },
    { id: 'payroll', label: 'Payroll', icon: FileText },
    { id: 'audit', label: 'Audit Log', icon: Users }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
      <div className="flex flex-wrap gap-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                  isActive ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
