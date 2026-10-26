import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'Ha ocurrido un error',
  message,
  onRetry
}) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-rose-950/60 border border-rose-800/70 text-rose-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 my-4 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-rose-900/40 border border-rose-700/50 text-rose-400 shrink-0">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-bold text-white text-base">{title}</h3>
          <p className="text-sm text-rose-200 mt-1">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-[44px] min-w-[44px] px-4 py-2 bg-rose-900 hover:bg-rose-800 active:bg-rose-950 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-rose-700/60 focus-visible:outline-2 focus-visible:outline-white shrink-0"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          <span>Reintentar</span>
        </button>
      )}
    </div>
  );
};
