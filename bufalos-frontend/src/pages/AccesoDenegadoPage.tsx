import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AccesoDenegadoPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-xl mx-auto my-12 text-center p-8 bg-night-850/95 border border-night-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-rose-950/60 border border-rose-700/80 text-rose-400 mb-6 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
        <ShieldAlert className="w-10 h-10" aria-hidden="true" />
      </div>

      <div className="inline-block px-3.5 py-1 rounded-full bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-black tracking-wider uppercase mb-3">
        Error HTTP 403 &bull; Prohibido
      </div>

      <h1 className="text-3xl font-black text-white tracking-tight mb-3">
        Acceso Denegado
      </h1>

      <p className="text-slate-200 text-base leading-relaxed mb-6">
        Su cuenta actual (<span className="text-amber-400 font-bold">{user?.correo || 'Usuario'}</span>) con rol{' '}
        <span className="font-bold text-white bg-night-800 px-2.5 py-1 rounded-lg border border-night-border">{user?.rol || 'Sin Rol'}</span> no
        posee los permisos requeridos para acceder a este módulo de administración.
      </p>

      <div className="bg-night-900/90 border border-night-border rounded-xl p-4 text-xs text-slate-300 text-left mb-8 space-y-1.5 shadow-inner">
        <p className="font-bold text-amber-400">Medida de Seguridad Aplicada (OWASP API5: BFLA):</p>
        <p>&bull; Control de Acceso Roto a Nivel de Función prevenido en Cliente mediante ruta privada.</p>
        <p>&bull; La API RESTful en ASP.NET Core rechaza paralelamente cualquier petición no autorizada con HTTP 403 Forbidden.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to="/catalogo"
          className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-[0_0_15px_rgba(245,158,11,0.25)] focus-visible:outline-2 focus-visible:outline-white"
        >
          <Home className="w-4 h-4" aria-hidden="true" />
          <span>Volver al Catálogo</span>
        </Link>
        <Link
          to="/login"
          className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-night-800 hover:bg-night-700 text-slate-200 border border-night-border font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Cambiar de Usuario</span>
        </Link>
      </div>
    </div>
  );
};
