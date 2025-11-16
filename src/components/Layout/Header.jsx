import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_NAMES } from '../../utils/enterpriseUtils';

const Header = ({ currentView, setCurrentView }) => {
  const { currentUser, logout } = useAuth();

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      logout();
      setCurrentView('home');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">On Cloud Payroll</h1>
          <p className="text-gray-600 mt-1">Enterprise Payroll Management System</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-2">
              <User size={20} className="text-gray-600" />
              <span className="font-semibold text-gray-800">{currentUser.name}</span>
            </div>
            <p className="text-sm text-gray-500">{ROLE_NAMES[currentUser.role]}</p>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
