import React from 'react';
import { Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-night-950 border-t border-night-border py-8 px-4 text-slate-300 text-sm mt-auto shadow-[0_-4px_25px_rgba(0,0,0,0.4)]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-4 h-4 text-amber-400" aria-hidden="true" />
          </div>
          <span className="font-extrabold text-white tracking-wide">Búfalos Tactical System</span>
          <span className="text-night-border hidden sm:inline">|</span>
          <span className="text-xs text-amber-300/80 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            UT2 - Consumo de APIs y Seguridad
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Evaluación 2 &bull; Lenguaje Programación Web II &bull; SQL Server &bull; Minimal API &bull; React
        </p>
      </div>
    </footer>
  );
};
