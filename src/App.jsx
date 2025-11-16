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
        
        {/* Placeholder for pages we haven't extracted yet */}
        {currentView === 'expenses' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Expenses Page</h2>
            <p className="text-gray-600 mb-4">This page is being refactored to modular structure.</p>
            <p className="text-sm text-gray-500">The old App.jsx has been backed up to App.jsx.backup</p>
          </div>
        )}
        
        {currentView === 'masterdata' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Master Data Page</h2>
            <p className="text-gray-600 mb-4">This page is being refactored to modular structure.</p>
            <p className="text-sm text-gray-500">The old App.jsx has been backed up to App.jsx.backup</p>
          </div>
        )}
        
        {currentView === 'payroll' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Payroll Page</h2>
            <p className="text-gray-600 mb-4">This page is being refactored to modular structure.</p>
            <p className="text-sm text-gray-500">The old App.jsx has been backed up to App.jsx.backup</p>
          </div>
        )}
        
        {currentView === 'audit' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Audit Log Page</h2>
            <p className="text-gray-600 mb-4">This page is being refactored to modular structure.</p>
            <p className="text-sm text-gray-500">The old App.jsx has been backed up to App.jsx.backup</p>
          </div>
        )}

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
          <p>On Cloud Payroll v3.0 | Modular Architecture</p>
        </div>
      </div>
    </div>
  );
}

export default App;
