import React from 'react';

export function Card({ children, className = '', onClick, hoverable = false, ...props }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-corp border border-videplast-border shadow-videplast
        ${hoverable ? 'hover:shadow-videplast-lg hover:border-gray-300 transition-all cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`p-4 md:p-5 border-b border-videplast-border ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-4 md:p-5 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div
      className={`p-4 md:p-5 border-t border-videplast-border bg-gray-50/50 rounded-b-corp ${className}`}
    >
      {children}
    </div>
  );
}
