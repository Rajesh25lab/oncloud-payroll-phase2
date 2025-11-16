import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';

// Components
import Login from './components/Auth/Login';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import ErrorDisplay from './components/ErrorDisplay';

// Pages
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import MasterData from './pages/MasterData';
import Payroll from './pages/Payroll';
import AuditLog from './pages/AuditLog';

const AppRouter = () => {
  const { currentUser, loading } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errors, setErrors] = useState([]);
  const [errorContext, setErrorContext] = useState('');

  // Show errors helper
  const showErrors = (errorList, context = '') => {
    setErrors(errorList);
    setErrorContext(context);
    setShowErrorModal(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - show login page
  if (!currentUser) {
    return (
      <>
        <Login />
        
        {/* Error Modal */}
        {showErrorModal && (
          <ErrorDisplay
            errors={errors}
            context={errorContext}
            onClose={() => {
              setShowErrorModal(false);
              setErrors([]);
            }}
          />
        )}
      </>
    );
  }

  // Logged in - show main app
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <Header currentView={currentView} setCurrentView={setCurrentView} />
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
        
        {/* Route to correct page */}
        {currentView === 'home' && <Dashboard showErrors={showErrors} />}
        {currentView === 'expenses' && <Expenses showErrors={showErrors} />}
        {currentView === 'masterdata' && <MasterData showErrors={showErrors} />}
        {currentView === 'payroll' && <Payroll />}
        {currentView === 'audit' && <AuditLog />}

        {/* Error Modal */}
        {showErrorModal && (
          <ErrorDisplay
            errors={errors}
            context={errorContext}
            onClose={() => {
              setShowErrorModal(false);
              setErrors([]);
            }}
          />
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>On Cloud Payroll v3.0 | Phase 1: State Management ✅</p>
        </div>
      </div>
    </div>
  );
};

export default AppRouter;
