import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ExpenseProvider } from './contexts/ExpenseContext';
import { AuditProvider } from './contexts/AuditContext';
import { ToastProvider } from './components/ToastProvider';
import AppRouter from './AppRouter';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <DataProvider>
          <ExpenseProvider>
            <AuditProvider>
              <AppRouter />
            </AuditProvider>
          </ExpenseProvider>
        </DataProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
