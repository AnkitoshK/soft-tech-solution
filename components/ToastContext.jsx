'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext({
  showToast: () => {},
});

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div 
        className={`toast ${toast.show ? 'show' : ''}`}
        role="status"
        style={{
          borderLeft: toast.type === 'error' ? '4px solid #ef4444' : '4px solid #22c55e',
        }}
      >
        <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
        <span>{toast.message}</span>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
