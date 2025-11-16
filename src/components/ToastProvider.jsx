// Toast Notification System - Better user feedback
// Replaces simple alerts with professional toast notifications

import React, { createContext, useContext, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

// Toast context
const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 5000, details = null) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      details,
      duration,
      timestamp: new Date()
    };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showSuccess = (message, details = null) => addToast(message, 'success', 5000, details);
  const showError = (message, details = null) => addToast(message, 'error', 8000, details);
  const showWarning = (message, details = null) => addToast(message, 'warning', 6000, details);
  const showInfo = (message, details = null) => addToast(message, 'info', 5000, details);

  const value = {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

// Individual Toast Component
const Toast = ({ toast, onClose }) => {
  const [showDetails, setShowDetails] = useState(false);

  const typeStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-800',
      icon: <CheckCircle size={20} className="text-green-600" />
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-800',
      icon: <AlertCircle size={20} className="text-red-600" />
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-500',
      text: 'text-orange-800',
      icon: <AlertCircle size={20} className="text-orange-600" />
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      text: 'text-blue-800',
      icon: <Info size={20} className="text-blue-600" />
    }
  };

  const style = typeStyles[toast.type] || typeStyles.info;

  return (
    <div 
      className={`${style.bg} border-l-4 ${style.border} rounded-lg shadow-lg p-4 min-w-[320px] max-w-md animate-slide-in`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {style.icon}
        </div>
        <div className="flex-1">
          <p className={`font-semibold ${style.text}`}>
            {toast.message}
          </p>
          {toast.details && (
            <div className="mt-2">
              {Array.isArray(toast.details) ? (
                <div className="space-y-1">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs font-medium underline"
                  >
                    {showDetails ? 'Hide' : 'Show'} details ({toast.details.length})
                  </button>
                  {showDetails && (
                    <ul className={`text-xs ${style.text} space-y-1 mt-2 max-h-32 overflow-y-auto`}>
                      {toast.details.map((detail, idx) => (
                        <li key={idx} className="pl-2">• {detail}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <p className={`text-xs ${style.text} mt-1`}>
                  {toast.details}
                </p>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${style.text} hover:opacity-70 transition`}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

// Standalone toast functions (can be used without provider)
let toastCallbacks = {
  showSuccess: () => {},
  showError: () => {},
  showWarning: () => {},
  showInfo: () => {}
};

export const setToastCallbacks = (callbacks) => {
  toastCallbacks = callbacks;
};

export const toast = {
  success: (message, details) => toastCallbacks.showSuccess(message, details),
  error: (message, details) => toastCallbacks.showError(message, details),
  warning: (message, details) => toastCallbacks.showWarning(message, details),
  info: (message, details) => toastCallbacks.showInfo(message, details)
};

export default ToastProvider;
