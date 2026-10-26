import React from 'react';
import { AlertTriangle, CheckCircle2, ArrowUpRight } from 'lucide-react';

export function Badge({
  situacao,
  children,
  variant,
  className = ''
}) {
  if (situacao) {
    switch (situacao) {
      case 'abaixo':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
            bg-red-50 text-red-700 border border-red-200/90 shadow-xs select-none transition-transform hover:scale-[1.02] ${className}`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span>Abaixo do Mínimo</span>
          </span>
        );
      case 'acima':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
            bg-amber-50 text-amber-900 border border-amber-300 shadow-xs select-none transition-transform hover:scale-[1.02] ${className}`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Acima do Máximo</span>
          </span>
        );
      case 'dentro':
      default:
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
            bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs select-none transition-transform hover:scale-[1.02] ${className}`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Dentro da Faixa</span>
          </span>
        );
    }
  }

  // Variantes genéricas estilizadas
  const genericStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-red-50 text-red-700 border-red-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-300',
    info: 'bg-blue-50 text-blue-700 border-blue-200'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        genericStyles[variant] || genericStyles.default
      } ${className}`}
    >
      {children}
    </span>
  );
}
