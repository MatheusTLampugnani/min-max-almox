import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  ...props
}) {
  // Variantes alinhadas ao design corporativo Videplast
  const variantStyles = {
    // Vermelho sólido (ações principais)
    primary:
      'bg-videplast-primary text-white hover:bg-videplast-primary-hover border border-transparent shadow-sm active:scale-[0.99]',
    // Vermelho vazado / contorno
    'outline-primary':
      'bg-transparent text-videplast-primary border-2 border-videplast-primary hover:bg-red-50 hover:border-videplast-primary-hover active:scale-[0.99]',
    // Cinza sólido
    secondary:
      'bg-videplast-secondary text-white hover:bg-gray-600 border border-transparent shadow-sm active:scale-[0.99]',
    // Cinza vazado
    'outline-secondary':
      'bg-transparent text-gray-700 border border-videplast-border hover:bg-gray-100 hover:text-videplast-dark active:scale-[0.99]',
    // Amarelo sólido (atenção, texto escuro)
    warning:
      'bg-videplast-warning text-videplast-dark hover:brightness-95 border border-transparent shadow-sm font-semibold active:scale-[0.99]',
    // Escuro sólido
    dark:
      'bg-videplast-dark text-white hover:bg-black border border-transparent shadow-sm active:scale-[0.99]',
    // Sucesso
    success:
      'bg-videplast-success text-white hover:brightness-95 border border-transparent shadow-sm active:scale-[0.99]',
    // Fantasma / texto simples
    ghost:
      'bg-transparent text-gray-600 hover:text-videplast-dark hover:bg-gray-100 active:scale-[0.99]'
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px]',
    md: 'text-sm font-medium px-4 py-2.5 min-h-[44px]',
    lg: 'text-base font-semibold px-6 py-3 min-h-[48px]'
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2 rounded-corp transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none
        ${variantStyles[variant] || variantStyles.primary}
        ${sizeStyles[size] || sizeStyles.md}
        ${className}
      `}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
}
