import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = 'Cargando datos...',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center p-6 text-slate-200 gap-3"
    >
      <Loader2 className={`animate-spin text-amber-400 filter drop-shadow-[0_0_10px_rgba(245,158,11,0.4)] ${sizeClasses[size]}`} aria-hidden="true" />
      <span className="text-sm font-semibold tracking-wide text-amber-300/90">{text}</span>
      <span className="sr-only">Procesando solicitud</span>
    </div>
  );
};
