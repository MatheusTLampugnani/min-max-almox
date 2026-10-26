import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    rightElement,
    className = '',
    id,
    ...props
  },
  ref
) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 pointer-events-none text-gray-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`
            w-full rounded-corp border bg-white text-videplast-dark px-3.5 py-2.5 min-h-[44px]
            text-sm md:text-sm placeholder-gray-400 transition-colors
            focus:bg-white focus:border-videplast-primary focus:ring-1 focus:ring-videplast-primary
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
            ${Icon ? 'pl-11' : ''}
            ${rightElement ? 'pr-11' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-videplast-border'}
            ${className}
          `}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-2 flex items-center">{rightElement}</div>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
});
