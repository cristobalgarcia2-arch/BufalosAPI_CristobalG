import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Package,
  LogOut,
  LogIn,
  Menu,
  X,
  User,
  Wrench,
  ShoppingBag,
  LayoutDashboard,
  Users,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, hasRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRolBadgeClass = (rol?: string) => {
    switch (rol) {
      case 'Administrador':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]';
      case 'Tecnico':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]';
      case 'Cliente':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.15)]';
      default:
        return 'bg-night-800 text-slate-300 border-night-border';
    }
  };

  return (
    <header className="bg-night-900/90 backdrop-blur-md border-b border-night-border sticky top-0 z-40 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Nombre de Marca con Acento Dorado */}
          <Link
            to="/catalogo"
            className="flex items-center gap-2.5 text-amber-400 hover:text-amber-300 font-black tracking-wider uppercase text-lg transition-all focus-visible:outline-2 focus-visible:outline-amber-400 rounded-md p-1 group"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-purple-900/40 border border-amber-500/40 flex items-center justify-center group-hover:border-amber-400 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-all">
              <Shield className="w-5 h-5 text-amber-400" aria-hidden="true" />
            </div>
            <span className="text-white font-black tracking-tight flex items-center gap-1.5">
              <span>BÚFALOS</span>
              <span className="text-amber-400 font-extrabold tracking-widest text-sm bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                TACTICAL
              </span>
            </span>
          </Link>

          {/* Navegación de Escritorio según Rol */}
          <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/catalogo"
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-200 hover:text-amber-300 hover:bg-night-800/80 hover:border-night-border border border-transparent transition-all py-2 px-3 rounded-lg focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              <Package className="w-4 h-4 text-amber-400/80" aria-hidden="true" />
              <span>Catálogo e Inventario</span>
            </Link>

            {/* Rol Cliente: Mis Pedidos y Soporte Técnico */}
            {hasRole('Cliente') && (
              <Link
                to="/cliente"
                className="flex items-center gap-1.5 text-sm font-semibold text-purple-300 hover:text-purple-200 hover:bg-purple-950/40 hover:border-purple-800/50 border border-transparent transition-all py-2 px-3 rounded-lg focus-visible:outline-2 focus-visible:outline-purple-400"
              >
                <ShoppingBag className="w-4 h-4 text-purple-400" aria-hidden="true" />
                <span>Mis Pedidos y Soporte</span>
              </Link>
            )}

            {/* Rol Técnico o Admin: Módulo de Soporte y Servicios Técnicos */}
            {(hasRole('Tecnico') || hasRole('Administrador')) && (
              <Link
                to="/tecnico"
                className="flex items-center gap-1.5 text-sm font-semibold text-cyan-300 hover:text-cyan-200 hover:bg-cyan-950/40 hover:border-cyan-800/50 border border-transparent transition-all py-2 px-3 rounded-lg focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                <Wrench className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                <span>Panel Técnico</span>
              </Link>
            )}

            {/* Solo Administrador: Panel Admin Master y Gestión de Usuarios */}
            {hasRole('Administrador') && (
              <>
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 text-sm font-semibold text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 hover:border-amber-800/50 border border-transparent transition-all py-2 px-3 rounded-lg focus-visible:outline-2 focus-visible:outline-amber-400"
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span>Panel Admin</span>
                </Link>
                <Link
                  to="/admin/usuarios"
                  className="flex items-center gap-1.5 text-sm font-semibold text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 hover:border-amber-800/50 border border-transparent transition-all py-2 px-3 rounded-lg focus-visible:outline-2 focus-visible:outline-amber-400"
                >
                  <Users className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span>Usuarios y Permisos</span>
                </Link>
              </>
            )}
          </nav>

          {/* Sección Derecha: Switch Tema + Usuario en Escritorio */}
          <div className="hidden md:flex items-center gap-3">
            {/* Botón Switch Modo Claro / Modo Oscuro */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={theme === 'dark' ? 'Activar Tema Claro' : 'Activar Tema Oscuro'}
              className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-night-850 hover:bg-night-800 text-amber-400 border border-night-border hover:border-amber-500/50 flex items-center justify-center transition-all shadow-sm focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-purple-600" aria-hidden="true" />
              )}
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 bg-night-850/80 border border-night-border px-3 py-1.5 rounded-xl shadow-inner">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-night-800 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
                    <User className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white leading-tight">{user.nombreCompleto}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded w-fit border mt-0.5 ${getRolBadgeClass(
                        user.rol
                      )}`}
                    >
                      {user.rol}
                    </span>
                  </div>
                </div>
                <div className="h-6 w-px bg-night-border" />
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                  className="min-h-[38px] min-w-[38px] flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-rose-400"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="min-h-[44px] px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-lg text-sm transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.25)] focus-visible:outline-2 focus-visible:outline-white"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>Ingresar</span>
              </Link>
            )}
          </div>

          {/* Botones Móvil: Theme Toggle + Hamburguesa */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="min-h-[40px] min-w-[40px] p-2 rounded-lg bg-night-800 text-amber-400 border border-night-border flex items-center justify-center focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-purple-600" />}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-200 hover:text-amber-400 bg-night-800 border border-night-border rounded-lg focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Desplegable en Móvil */}
      {mobileMenuOpen && (
        <nav
          aria-label="Navegación móvil"
          className="md:hidden border-t border-night-border bg-night-900/98 backdrop-blur-lg px-4 pt-3 pb-5 space-y-2 shadow-2xl"
        >
          <Link
            to="/catalogo"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 min-h-[44px] px-3 rounded-lg text-slate-200 hover:text-amber-300 hover:bg-night-800 font-semibold"
          >
            <Package className="w-5 h-5 text-amber-400" aria-hidden="true" />
            <span>Catálogo e Inventario</span>
          </Link>

          {hasRole('Cliente') && (
            <Link
              to="/cliente"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 min-h-[44px] px-3 rounded-lg text-purple-300 hover:bg-purple-950/40 font-semibold"
            >
              <ShoppingBag className="w-5 h-5 text-purple-400" aria-hidden="true" />
              <span>Mis Pedidos y Soporte</span>
            </Link>
          )}

          {(hasRole('Tecnico') || hasRole('Administrador')) && (
            <Link
              to="/tecnico"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 min-h-[44px] px-3 rounded-lg text-cyan-300 hover:bg-cyan-950/40 font-semibold"
            >
              <Wrench className="w-5 h-5 text-cyan-400" aria-hidden="true" />
              <span>Panel Técnico</span>
            </Link>
          )}

          {hasRole('Administrador') && (
            <>
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 min-h-[44px] px-3 rounded-lg text-amber-300 hover:bg-amber-950/40 font-semibold"
              >
                <LayoutDashboard className="w-5 h-5 text-amber-400" aria-hidden="true" />
                <span>Panel Admin</span>
              </Link>
              <Link
                to="/admin/usuarios"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 min-h-[44px] px-3 rounded-lg text-amber-300 hover:bg-amber-950/40 font-semibold"
              >
                <Users className="w-5 h-5 text-amber-400" aria-hidden="true" />
                <span>Gestión de Usuarios</span>
              </Link>
            </>
          )}

          <div className="border-t border-night-border pt-3">
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="px-3 py-2 bg-night-850 rounded-xl border border-night-border">
                  <p className="text-sm font-bold text-white">{user.nombreCompleto}</p>
                  <p className="text-xs text-slate-300">{user.correo}</p>
                  <span
                    className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getRolBadgeClass(
                      user.rol
                    )}`}
                  >
                    Rol: {user.rol}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 min-h-[44px] px-3 rounded-lg text-rose-400 hover:bg-rose-950/40 font-semibold text-left border border-rose-900/30"
                >
                  <LogOut className="w-5 h-5" aria-hidden="true" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-lg text-sm shadow-md"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>Ingresar al Sistema</span>
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};
