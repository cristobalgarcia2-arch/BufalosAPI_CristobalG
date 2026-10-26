import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto my-16 text-center p-8 bg-night-850/95 border border-night-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-4 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
        <FileQuestion className="w-8 h-8" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-black text-white mb-2">Página no encontrada (404)</h1>
      <p className="text-sm text-slate-300 mb-6">
        La ruta solicitada no existe o ha sido movida dentro del sistema.
      </p>
      <Link
        to="/catalogo"
        className="inline-flex items-center gap-2 min-h-[44px] px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] focus-visible:outline-2 focus-visible:outline-white"
      >
        <Home className="w-4 h-4" aria-hidden="true" />
        <span>Ir al Catálogo Principal</span>
      </Link>
    </div>
  );
};
