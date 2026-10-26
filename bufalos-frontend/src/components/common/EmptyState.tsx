import React from 'react';
import { PackageSearch } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No se encontraron registros',
  description = 'No hay datos disponibles que coincidan con los filtros seleccionados.',
  actionText,
  onAction
}) => {
  return (
    <div
      role="region"
      aria-label="Estado sin resultados"
      className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-night-850/70 border border-night-border rounded-2xl my-6 shadow-md"
    >
      <div className="w-16 h-16 rounded-2xl bg-night-800 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
        <PackageSearch className="w-8 h-8" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-black text-white">{title}</h3>
      <p className="text-sm text-slate-300 max-w-md mt-2 mb-6">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="min-h-[44px] px-5 py-2.5 bg-night-800 hover:bg-night-750 active:bg-night-900 text-amber-400 border border-amber-500/40 rounded-xl text-sm font-bold transition-all shadow-sm focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
