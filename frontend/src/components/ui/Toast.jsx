import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((mensagem, tipo = 'sucesso', duracaoMs = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, mensagem, tipo }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duracaoMs);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`
              pointer-events-auto flex items-start gap-3 p-3.5 rounded-corp shadow-lg border text-sm font-medium
              animate-slideUp transition-all duration-200
              ${
                toast.tipo === 'sucesso'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : toast.tipo === 'erro'
                  ? 'bg-red-50 text-red-900 border-red-300'
                  : 'bg-blue-50 text-blue-900 border-blue-300'
              }
            `}
          >
            {toast.tipo === 'sucesso' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            {toast.tipo === 'erro' && (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            {toast.tipo === 'info' && (
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            )}
            <p className="flex-1 text-xs sm:text-sm">{toast.mensagem}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-700 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      addToast: (msg, tipo) => {
        if (tipo === 'erro') console.error('[TOAST ERRO]', msg);
        else console.log('[TOAST SUCESSO]', msg);
      }
    };
  }
  return context;
}
