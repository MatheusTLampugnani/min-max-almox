import React from 'react';
import { PackageSearch } from 'lucide-react';
import { Button } from './Button.jsx';

export function EmptyState({
  icon: Icon = PackageSearch,
  title = 'Nenhum material encontrado',
  description = 'Tente outro termo ou limpe os filtros para visualizar os itens cadastrados.',
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white rounded-corp border border-dashed border-gray-300 ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-videplast-primary mb-4 shadow-sm">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-videplast-dark mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-500 max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline-primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
