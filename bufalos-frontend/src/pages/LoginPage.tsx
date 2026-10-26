import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, AlertTriangle, KeyRound, UserPlus, User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import type { ApiError } from '../types';

const loginSchema = z.object({
  correo: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Ingrese un formato de correo electrónico válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
});

const registroSchema = z.object({
  nombreCompleto: z
    .string()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres'),
  correo: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Ingrese un formato de correo electrónico válido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  id_Rol: z.coerce
    .number()
    .min(1, 'Debe seleccionar un rol válido')
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegistroFormData = z.infer<typeof registroSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'login' | 'registro'>('login');
  const [serverError, setServerError] = useState<string | null>(null);
  const [registroExitoso, setRegistroExitoso] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/catalogo';

  // Formulario de Inicio de Sesión
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    setValue: setLoginValue,
    formState: { errors: loginErrors, isSubmitting: isSubmittingLogin }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      correo: '',
      password: ''
    }
  });

  // Formulario de Registro de Usuario
  const {
    register: registerSignup,
    handleSubmit: handleSubmitSignup,
    formState: { errors: signupErrors, isSubmitting: isSubmittingSignup },
    reset: resetSignup
  } = useForm<RegistroFormData>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      nombreCompleto: '',
      correo: '',
      password: '',
      id_Rol: 3 // Por defecto Cliente
    }
  });

  const onSubmitLogin = async (data: LoginFormData) => {
    setServerError(null);
    setRegistroExitoso(null);
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err) {
      const error = err as ApiError;
      setServerError(error.message || 'Error al autenticar. Verifique sus credenciales.');
    }
  };

  const onSubmitRegistro = async (data: RegistroFormData) => {
    setServerError(null);
    setRegistroExitoso(null);
    try {
      await authService.registro({
        nombreCompleto: data.nombreCompleto.trim(),
        correo: data.correo.trim().toLowerCase(),
        password: data.password,
        id_Rol: Number(data.id_Rol),
        fechaNacimiento: '2000-01-01T00:00:00Z',
        esVerificado: true
      });

      setRegistroExitoso(`¡Cuenta registrada exitosamente para ${data.nombreCompleto}! Iniciando sesión...`);
      resetSignup();

      // Iniciar sesión automáticamente con la nueva cuenta
      try {
        await login({ correo: data.correo.trim().toLowerCase(), password: data.password });
        navigate(from, { replace: true });
      } catch {
        setActiveTab('login');
        setLoginValue('correo', data.correo);
        setLoginValue('password', data.password);
      }
    } catch (err) {
      const error = err as ApiError;
      setServerError(error.message || 'Error al registrar usuario en la base de datos.');
    }
  };

  // Ayudantes de demostración para evaluación
  const setQuickCreds = (correo: string, pass: string) => {
    setActiveTab('login');
    setLoginValue('correo', correo, { shouldValidate: true });
    setLoginValue('password', pass, { shouldValidate: true });
  };

  return (
    <div className="max-w-md mx-auto my-8">
      <div className="bg-night-850/95 border border-night-border rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.08)] p-8 backdrop-blur-md">
        {/* Encabezado de Marca */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 mb-3 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Shield className="w-9 h-9" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Búfalos Tactical</h1>
          <p className="text-sm text-slate-300 mt-1">
            Plataforma de equipamiento táctico e inventario operativo
          </p>
        </div>

        {/* Pestañas de Alternancia: Iniciar Sesión vs. Registro */}
        <div className="flex rounded-xl bg-night-900 p-1 mb-6 border border-night-border">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setServerError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 min-h-[38px] ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Iniciar Sesión</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('registro');
              setServerError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 min-h-[38px] ${
              activeTab === 'registro'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Cuenta</span>
          </button>
        </div>

        {/* Mensaje de Éxito de Registro */}
        {registroExitoso && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 p-4 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-sm flex items-start gap-3 shadow-md"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{registroExitoso}</span>
          </div>
        )}

        {/* Mensaje de Error de Servidor o Rate Limit / Cuenta Baneada */}
        {serverError && (
          <div
            role="alert"
            aria-live="assertive"
            className={`mb-6 p-4 rounded-xl text-sm flex items-start gap-3 shadow-md ${
              serverError.toLowerCase().includes('suspendida') || serverError.toLowerCase().includes('baneada')
                ? 'bg-rose-950/90 border-2 border-rose-600 text-rose-100 shadow-[0_0_20px_rgba(225,29,72,0.3)]'
                : 'bg-rose-950/70 border border-rose-800 text-rose-200'
            }`}
          >
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              {(serverError.toLowerCase().includes('suspendida') || serverError.toLowerCase().includes('baneada')) && (
                <strong className="block text-rose-300 font-black uppercase tracking-wider text-xs">
                  Acceso Denegado - Cuenta Suspendida / Baneada
                </strong>
              )}
              <span>{serverError}</span>
            </div>
          </div>
        )}

        {/* FORMULARIO 1: INICIAR SESIÓN */}
        {activeTab === 'login' && (
          <form onSubmit={handleSubmitLogin(onSubmitLogin)} noValidate className="space-y-5">
            {/* Campo Correo */}
            <div>
              <label htmlFor="correo-input" className="block text-sm font-bold text-white mb-1.5">
                Correo Electrónico <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/70">
                  <Mail className="w-5 h-5" aria-hidden="true" />
                </div>
                <input
                  id="correo-input"
                  type="email"
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={!!loginErrors.correo}
                  aria-describedby={loginErrors.correo ? 'correo-error' : undefined}
                  {...registerLogin('correo')}
                  className={`w-full pl-11 pr-4 py-2.5 bg-night-900 border rounded-xl text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors placeholder-slate-500 ${
                    loginErrors.correo ? 'border-rose-500 focus:ring-rose-500' : 'border-night-border hover:border-night-border'
                  }`}
                  placeholder="usuario@bufalos.cl"
                />
              </div>
              {loginErrors.correo && (
                <p id="correo-error" role="alert" className="mt-1.5 text-xs text-rose-400 font-semibold">
                  {loginErrors.correo.message}
                </p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div>
              <label htmlFor="password-input" className="block text-sm font-bold text-white mb-1.5">
                Contraseña <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/70">
                  <Lock className="w-5 h-5" aria-hidden="true" />
                </div>
                <input
                  id="password-input"
                  type="password"
                  autoComplete="current-password"
                  aria-required="true"
                  aria-invalid={!!loginErrors.password}
                  aria-describedby={loginErrors.password ? 'password-error' : undefined}
                  {...registerLogin('password')}
                  className={`w-full pl-11 pr-4 py-2.5 bg-night-900 border rounded-xl text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors placeholder-slate-500 ${
                    loginErrors.password ? 'border-rose-500 focus:ring-rose-500' : 'border-night-border hover:border-night-border'
                  }`}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                />
              </div>
              {loginErrors.password && (
                <p id="password-error" role="alert" className="mt-1.5 text-xs text-rose-400 font-semibold">
                  {loginErrors.password.message}
                </p>
              )}
            </div>

            {/* Botón de Envío Login */}
            <button
              type="submit"
              disabled={isSubmittingLogin}
              className="w-full min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:bg-amber-600 text-slate-950 font-black rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(245,158,11,0.25)] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-white"
            >
              {isSubmittingLogin ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" aria-hidden="true" />
                  <span>Ingresar al Catálogo</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* FORMULARIO 2: REGISTRO DE NUEVO USUARIO (POR ROL) */}
        {activeTab === 'registro' && (
          <form onSubmit={handleSubmitSignup(onSubmitRegistro)} noValidate className="space-y-4">
            {/* Nombre Completo */}
            <div>
              <label htmlFor="reg-nombre" className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
                Nombre Completo <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/70">
                  <User className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="reg-nombre"
                  type="text"
                  aria-invalid={!!signupErrors.nombreCompleto}
                  {...registerSignup('nombreCompleto')}
                  className="w-full pl-10 pr-3 py-2 bg-night-900 border border-night-border rounded-xl text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400 placeholder-slate-500"
                  placeholder="Ej. Rodrigo Tapia"
                />
              </div>
              {signupErrors.nombreCompleto && (
                <p role="alert" className="mt-1 text-xs text-rose-400 font-semibold">
                  {signupErrors.nombreCompleto.message}
                </p>
              )}
            </div>

            {/* Correo Electrónico */}
            <div>
              <label htmlFor="reg-correo" className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
                Correo Electrónico <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/70">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="reg-correo"
                  type="email"
                  aria-invalid={!!signupErrors.correo}
                  {...registerSignup('correo')}
                  className="w-full pl-10 pr-3 py-2 bg-night-900 border border-night-border rounded-xl text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400 placeholder-slate-500"
                  placeholder="nuevo.usuario@bufalos.cl"
                />
              </div>
              {signupErrors.correo && (
                <p role="alert" className="mt-1 text-xs text-rose-400 font-semibold">
                  {signupErrors.correo.message}
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="reg-pass" className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
                Contraseña <span className="text-amber-400">* (Mínimo 6 caracteres)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/70">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="reg-pass"
                  type="password"
                  aria-invalid={!!signupErrors.password}
                  {...registerSignup('password')}
                  className="w-full pl-10 pr-3 py-2 bg-night-900 border border-night-border rounded-xl text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400 placeholder-slate-500"
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                />
              </div>
              {signupErrors.password && (
                <p role="alert" className="mt-1 text-xs text-rose-400 font-semibold">
                  {signupErrors.password.message}
                </p>
              )}
            </div>

            {/* Selección de Rol Deseado (SQL Server Id_Rol) */}
            <div>
              <label htmlFor="reg-rol" className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
                Rol en la Plataforma <span className="text-amber-400">*</span>
              </label>
              <select
                id="reg-rol"
                {...registerSignup('id_Rol')}
                className="w-full p-2.5 bg-night-900 border border-night-border rounded-xl text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              >
                <option value={3} className="bg-night-900 text-white">Cliente (Compras, Catálogo y Solicitudes)</option>
                <option value={2} className="bg-night-900 text-white">Técnico (Diagnóstico, Bitácoras y Despacho)</option>
                <option value={1} className="bg-night-900 text-white">Administrador (Control Total CRUD y Métricas)</option>
              </select>
              {signupErrors.id_Rol && (
                <p role="alert" className="mt-1 text-xs text-rose-400 font-semibold">
                  {signupErrors.id_Rol.message}
                </p>
              )}
            </div>

            {/* Botón de Envío Registro */}
            <button
              type="submit"
              disabled={isSubmittingSignup}
              className="w-full min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:bg-amber-600 text-slate-950 font-black rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(245,158,11,0.25)] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-white mt-4"
            >
              {isSubmittingSignup ? (
                <span>Creando cuenta en SQL Server...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" aria-hidden="true" />
                  <span>Registrar Cuenta</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Cajas de Ayuda para Pruebas / Demostración Rápida */}
        <div className="mt-8 pt-6 border-t border-night-border">
          <p className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2.5 text-center">
            Cuentas de Prueba Preconfiguradas:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setQuickCreds('admin@bufalos.cl', 'Admin123!')}
              className="text-left p-2.5 rounded-xl bg-night-900/90 hover:bg-night-800 border border-amber-500/30 hover:border-amber-400 text-xs transition-all focus-visible:outline-2 focus-visible:outline-amber-400 shadow-sm"
            >
              <div className="font-extrabold text-amber-400">Administrador</div>
              <div className="text-slate-300 text-[11px] truncate mt-0.5">admin@bufalos.cl</div>
            </button>
            <button
              type="button"
              onClick={() => setQuickCreds('tecnico@bufalos.cl', 'Tecnico123!')}
              className="text-left p-2.5 rounded-xl bg-night-900/90 hover:bg-night-800 border border-cyan-500/30 hover:border-cyan-400 text-xs transition-all focus-visible:outline-2 focus-visible:outline-cyan-400 shadow-sm"
            >
              <div className="font-extrabold text-cyan-400">Técnico</div>
              <div className="text-slate-300 text-[11px] truncate mt-0.5">tecnico@bufalos.cl</div>
            </button>
            <button
              type="button"
              onClick={() => setQuickCreds('cliente@gmail.com', 'Cliente123!')}
              className="text-left p-2.5 rounded-xl bg-night-900/90 hover:bg-night-800 border border-purple-500/30 hover:border-purple-400 text-xs transition-all focus-visible:outline-2 focus-visible:outline-purple-400 shadow-sm"
            >
              <div className="font-extrabold text-purple-400">Cliente</div>
              <div className="text-slate-300 text-[11px] truncate mt-0.5">cliente@gmail.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
