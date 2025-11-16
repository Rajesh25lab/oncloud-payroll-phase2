import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { ToastProvider } from './components/ToastProvider';
import ErrorDisplay from './components/ErrorDisplay';

// Components
import Login from './components/Auth/Login';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import MasterData from './pages/MasterData';
import Payroll from './pages/Payroll';
import AuditLog from './pages/AuditLog';

function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ToastProvider>
  );
}

function AppContent() {
  const {
    currentUser,
    currentView,
    showErrorModal,
    setShowErrorModal,
    errors,
    setErrors,
    errorContext
  } = useApp();

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
        <Header />
        <Sidebar />
        
        {/* Route to correct page */}
        {currentView === 'home' && <Dashboard />}
        {currentView === 'expenses' && <Expenses />}
        {currentView === 'masterdata' && <MasterData />}
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
          <p>On Cloud Payroll v3.0 | Modular Architecture | All Functional</p>
        </div>
      </div>
    </div>
  );
}

export default App;
