import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  timestamp: number;
}

interface ToastContextType {
  showToast: (title: string, message?: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((title: string, message?: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastItem = { id, title, message, type, timestamp: Date.now() };

    setToasts((prev) => [...prev.slice(-3), newToast]); // Limit to max 4 concurrent toasts

    // Auto-dismiss after 4.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      {/* Accessible Toast Container with aria-live */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';
          const isError = toast.type === 'error';

          const borderColor = isSuccess
            ? 'border-emerald-300'
            : isWarning
            ? 'border-amber-300'
            : isError
            ? 'border-rose-300'
            : 'border-blue-300';

          const iconColor = isSuccess
            ? 'text-emerald-600'
            : isWarning
            ? 'text-amber-600'
            : isError
            ? 'text-rose-600'
            : 'text-[#0E62FE]';

          const badgeBg = isSuccess
            ? 'bg-emerald-50 text-emerald-800'
            : isWarning
            ? 'bg-amber-50 text-amber-800'
            : isError
            ? 'bg-rose-50 text-rose-800'
            : 'bg-blue-50 text-blue-800';

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto p-4 rounded-2xl bg-white/95 backdrop-blur-md border shadow-xl flex items-start justify-between gap-3 animate-in slide-in-from-top-3 fade-in duration-200 transition-all ${borderColor}`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="shrink-0 mt-0.5">
                  {isSuccess ? (
                    <CheckCircle2 className={`w-5 h-5 ${iconColor}`} />
                  ) : isWarning ? (
                    <AlertTriangle className={`w-5 h-5 ${iconColor}`} />
                  ) : isError ? (
                    <AlertCircle className={`w-5 h-5 ${iconColor}`} />
                  ) : (
                    <Info className={`w-5 h-5 ${iconColor}`} />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-slate-900 leading-tight">
                      {toast.title}
                    </span>
                    <span className={`text-[8.5px] font-mono font-black uppercase px-1.5 py-0.2 rounded-full ${badgeBg}`}>
                      {toast.type}
                    </span>
                  </div>
                  {toast.message && (
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-snug break-words">
                      {toast.message}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-700 shrink-0 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Dismiss notification"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
