import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Search,
  UserCheck,
  UserX,
  PlusCircle,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  ArrowLeft,
  Mail,
  Award
} from 'lucide-react';
import { usuarioService, type OtorgarPermisoRequest } from '../../services/usuarioService';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { Modal } from '../../components/common/Modal';
import type { Usuario, ApiError } from '../../types';

const PRESET_PERMISOS = [
  {
    tipo: 'Personal Autorizado (Fuerzas de Orden / Seguridad)',
    descripcion: 'Habilita la compra de artículos de uso exclusivo policial, militar y protección balística.'
  },
  {
    tipo: 'Porte de Armas / Caza',
    descripcion: 'Autoriza la adquisición de miras, armamento deportivo, munición y artículos regulados.'
  },
  {
    tipo: 'Mayor de Edad Verificado (+18)',
    descripcion: 'Acredita mayoría de edad para adquisición de cuchillos tácticos y equipamiento para adultos.'
  },
  {
    tipo: 'Equipamiento Táctico Regulado',
    descripcion: 'Permiso especial para chalecos portaplacas nivel balístico e instrumental óptico avanzado.'
  }
];

export const AdminUsuariosPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Estados de Búsqueda y Filtros
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  // Estados de Modales
  const [modalPermisoAbierto, setModalPermisoAbierto] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);

  // Formulario de Otorgar Permiso
  const [tipoPermiso, setTipoPermiso] = useState(PRESET_PERMISOS[0].tipo);
  const [tipoPermisoCustom, setTipoPermisoCustom] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [fechaExpiracion, setFechaExpiracion] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [permisoError, setPermisoError] = useState<string | null>(null);
  const [accionMensaje, setAccionMensaje] = useState<{ texto: string; tipo: 'exito' | 'error' } | null>(null);

  // Consulta de usuarios registrados en el backend
  const {
    data: usuarios = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<Usuario[]>({
    queryKey: ['admin-usuarios'],
    queryFn: () => usuarioService.getUsuarios(),
    refetchInterval: 5000
  });

  // Mutación para Cambiar Estado (Banear / Reactivar)
  const cambiarEstadoMutation = useMutation({
    mutationFn: ({ id, esVerificado }: { id: number; esVerificado: boolean }) =>
      usuarioService.cambiarEstadoUsuario(id, esVerificado),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
      setAccionMensaje({
        texto: res.mensaje || (res.esVerificado ? 'Cuenta reactivada con éxito.' : 'Cuenta suspendida/baneada.'),
        tipo: 'exito'
      });
      setTimeout(() => setAccionMensaje(null), 4000);
    },
    onError: (err: ApiError) => {
      setAccionMensaje({
        texto: err.message || 'No fue posible modificar el estado de la cuenta.',
        tipo: 'error'
      });
      setTimeout(() => setAccionMensaje(null), 5000);
    }
  });

  // Mutación para Otorgar Permiso Especial
  const otorgarPermisoMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: OtorgarPermisoRequest }) =>
      usuarioService.otorgarPermiso(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
      setModalPermisoAbierto(false);
      setNumeroDocumento('');
      setTipoPermisoCustom('');
      setPermisoError(null);
      setAccionMensaje({
        texto: 'Permiso especial concedido exitosamente y registrado en TB_PermisosUsuarios.',
        tipo: 'exito'
      });
      setTimeout(() => setAccionMensaje(null), 4000);
    },
    onError: (err: ApiError) => {
      setPermisoError(err.message || 'Error al persistir el permiso en el servidor.');
    }
  });

  // Mutación para Revocar Permiso
  const revocarPermisoMutation = useMutation({
    mutationFn: ({ usuarioId, permisoId }: { usuarioId: number; permisoId: number }) =>
      usuarioService.revocarPermiso(usuarioId, permisoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
      setAccionMensaje({
        texto: 'Permiso revocado con éxito del usuario.',
        tipo: 'exito'
      });
      setTimeout(() => setAccionMensaje(null), 4000);
    },
    onError: (err: ApiError) => {
      setAccionMensaje({
        texto: err.message || 'Error al revocar el permiso.',
        tipo: 'error'
      });
      setTimeout(() => setAccionMensaje(null), 5000);
    }
  });

  const handleToggleEstado = (u: Usuario) => {
    const idUsuario = u.id_Usuario || u.id || 0;
    if (idUsuario === currentUser?.id_Usuario) {
      alert('Por motivos de seguridad, no puede suspender su propia cuenta de administrador.');
      return;
    }
    const nuevoEstado = !u.esVerificado;
    const confirmacion = window.confirm(
      nuevoEstado
        ? `¿Desea reactivar la cuenta de "${u.nombreCompleto}"? Podrá volver a iniciar sesión y operar en la plataforma.`
        : `¿Está seguro de suspender/banear la cuenta de "${u.nombreCompleto}"? El usuario no podrá iniciar sesión y el sistema rechazará su acceso.`
    );
    if (confirmacion) {
      cambiarEstadoMutation.mutate({ id: idUsuario, esVerificado: nuevoEstado });
    }
  };

  const handleAbrirModalPermiso = (u: Usuario) => {
    setUsuarioSeleccionado(u);
    setTipoPermiso(PRESET_PERMISOS[0].tipo);
    setTipoPermisoCustom('');
    setNumeroDocumento(`DOC-${Math.floor(100000 + Math.random() * 900000)}`);
    setPermisoError(null);
    setModalPermisoAbierto(true);
  };

  const handleGuardarPermiso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioSeleccionado) return;

    const tipoFinal = tipoPermiso === 'OTRO' ? tipoPermisoCustom.trim() : tipoPermiso;
    if (!tipoFinal) {
      setPermisoError('Debe indicar el tipo de permiso.');
      return;
    }

    const idUsuario = usuarioSeleccionado.id_Usuario || usuarioSeleccionado.id || 0;
    otorgarPermisoMutation.mutate({
      id: idUsuario,
      data: {
        tipoPermiso: tipoFinal,
        numeroDocumento: numeroDocumento.trim() || undefined,
        fechaExpiracion: new Date(fechaExpiracion).toISOString()
      }
    });
  };

  // Filtrado de usuarios en memoria
  const usuariosFiltrados = usuarios.filter((u) => {
    const term = terminoBusqueda.toLowerCase().trim();
    const coincideTexto =
      !term ||
      u.nombreCompleto.toLowerCase().includes(term) ||
      u.correo.toLowerCase().includes(term);

    const coincideRol =
      filtroRol === 'todos' ||
      u.rol.toLowerCase() === filtroRol.toLowerCase() ||
      (filtroRol === 'Admin' && u.rol.toLowerCase() === 'administrador');

    const coincideEstado =
      filtroEstado === 'todos' ||
      (filtroEstado === 'activos' && u.esVerificado) ||
      (filtroEstado === 'baneados' && !u.esVerificado);

    return coincideTexto && coincideRol && coincideEstado;
  });

  // Métricas
  const totalUsuarios = usuarios.length;
  const totalActivos = usuarios.filter((u) => u.esVerificado).length;
  const totalBaneados = usuarios.filter((u) => !u.esVerificado).length;
  const totalConPermisos = usuarios.filter((u) => u.permisos && u.permisos.length > 0).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado y Navegación de Retorno */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Panel Admin Master</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-amber-400" aria-hidden="true" />
            <span>Gestión de Usuarios y Permisos Especiales</span>
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Administración centralizada de cuentas de usuario, estado de baneo y permisos tácticos regulados (TB_Usuarios y TB_PermisosUsuarios).
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="min-h-[44px] px-4 py-2 bg-night-850 hover:bg-night-800 border border-night-border hover:border-amber-500/40 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          <span>Actualizar Lista</span>
        </button>
      </div>

      {/* Banner de Feedback Acciones */}
      {accionMensaje && (
        <div
          role="alert"
          aria-live="polite"
          className={`p-4 rounded-xl text-sm flex items-center gap-3 border shadow-md transition-all ${
            accionMensaje.tipo === 'exito'
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
              : 'bg-rose-950/80 border-rose-700 text-rose-200'
          }`}
        >
          {accionMensaje.tipo === 'exito' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{accionMensaje.texto}</span>
        </div>
      )}

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-night-850/95 border border-night-border p-4 rounded-2xl shadow-md">
          <span className="text-xs text-slate-400 font-semibold block">Total Registrados</span>
          <span className="text-2xl font-black text-white mt-1 block">{totalUsuarios}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Cuentas en Bufalos_DB</span>
        </div>

        <div className="bg-night-850/95 border border-night-border p-4 rounded-2xl shadow-md">
          <span className="text-xs text-emerald-400 font-semibold block flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Cuentas Activas</span>
          </span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">{totalActivos}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Acceso permitido</span>
        </div>

        <div className="bg-night-850/95 border border-night-border p-4 rounded-2xl shadow-md">
          <span className="text-xs text-rose-400 font-semibold block flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Cuentas Baneadas</span>
          </span>
          <span className="text-2xl font-black text-rose-400 mt-1 block">{totalBaneados}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Acceso bloqueado en login</span>
        </div>

        <div className="bg-night-850/95 border border-night-border p-4 rounded-2xl shadow-md">
          <span className="text-xs text-amber-400 font-semibold block flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            <span>Con Permisos Especiales</span>
          </span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">{totalConPermisos}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Fuerzas / Caza / +18</span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-night-850/95 border border-night-border rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Búsqueda por Texto */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" aria-hidden="true" />
            <input
              type="text"
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              placeholder="Buscar por nombre completo o correo..."
              className="w-full pl-10 pr-4 py-2 bg-night-900 border border-night-border rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-colors"
            />
          </div>

          {/* Filtro por Rol */}
          <div className="md:col-span-3">
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              aria-label="Filtrar por rol de usuario"
              className="w-full py-2 px-3 bg-night-900 border border-night-border rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
            >
              <option value="todos" className="bg-night-900 text-white">Todos los Roles</option>
              <option value="Cliente" className="bg-night-900 text-white">Solo Clientes</option>
              <option value="Tecnico" className="bg-night-900 text-white">Solo Técnicos</option>
              <option value="Administrador" className="bg-night-900 text-white">Solo Administradores</option>
            </select>
          </div>

          {/* Filtro por Estado (Baneo) */}
          <div className="md:col-span-3">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              aria-label="Filtrar por estado de cuenta"
              className="w-full py-2 px-3 bg-night-900 border border-night-border rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
            >
              <option value="todos" className="bg-night-900 text-white">Todos los Estados</option>
              <option value="activos" className="bg-night-900 text-white">Cuentas Activas / Verificadas</option>
              <option value="baneados" className="bg-night-900 text-white">Cuentas Baneadas / Suspendidas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listado de Usuarios */}
      {isLoading && (
        <div className="py-16">
          <LoadingSpinner text="Cargando base de datos de usuarios..." size="lg" />
        </div>
      )}

      {isError && (
        <ErrorAlert
          title="Error al consultar usuarios"
          message={(error as any)?.message || 'No fue posible conectar con el endpoint de administración de usuarios.'}
          onRetry={refetch}
        />
      )}

      {!isLoading && !isError && usuariosFiltrados.length === 0 && (
        <div className="bg-night-850/95 border border-night-border rounded-2xl p-8 text-center space-y-3">
          <UserX className="w-12 h-12 text-slate-500 mx-auto" />
          <h2 className="text-base font-bold text-white">No se encontraron usuarios coincidentes</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Pruebe modificando el término de búsqueda o restableciendo los selectores de rol y estado.
          </p>
        </div>
      )}

      {!isLoading && !isError && usuariosFiltrados.length > 0 && (
        <div className="space-y-4">
          {usuariosFiltrados.map((u) => {
            const idUsuario = u.id_Usuario || u.id || 0;
            const esActivo = !!u.esVerificado;
            const esElAdminActual = idUsuario === currentUser?.id_Usuario;
            const tienePermisos = u.permisos && u.permisos.length > 0;

            return (
              <div
                key={idUsuario}
                className={`bg-night-850/95 border rounded-2xl p-5 sm:p-6 transition-all shadow-md space-y-4 ${
                  esActivo ? 'border-night-border hover:border-amber-500/30' : 'border-rose-900/60 bg-rose-950/20'
                }`}
              >
                {/* Fila Principal: Datos del Usuario, Rol y Estado de Baneo */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-night-border pb-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-inner ${
                        esActivo
                          ? 'bg-night-900 border-amber-500/30 text-amber-400'
                          : 'bg-rose-950 border-rose-700 text-rose-400'
                      }`}
                    >
                      {esActivo ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-white text-base">{u.nombreCompleto}</span>
                        <span className="font-mono text-xs text-slate-400">#UID-{idUsuario}</span>

                        {/* Badge de Rol */}
                        <span
                          className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            u.rol === 'Administrador'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                              : u.rol === 'Tecnico' || u.rol === 'Técnico'
                              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                              : 'bg-purple-500/15 text-purple-300 border-purple-500/40'
                          }`}
                        >
                          {u.rol}
                        </span>

                        {/* Badge de Estado de Baneo */}
                        {esActivo ? (
                          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Activo / Verificado</span>
                          </span>
                        ) : (
                          <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center gap-1 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                            <Lock className="w-3 h-3" />
                            <span>Baneado / Suspendido</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono">{u.correo}</span>
                        </span>
                        {u.fechaNacimiento && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Nacimiento: {new Date(u.fechaNacimiento).toLocaleDateString('es-CL')}</span>
                          </span>
                        )}
                        {u.fechaCreacion && (
                          <span className="text-slate-400 font-mono text-[11px]">
                            Registrado: {new Date(u.fechaCreacion).toLocaleDateString('es-CL')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones de Gestión de Cuenta (Baneo) */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      disabled={esElAdminActual || cambiarEstadoMutation.isPending}
                      onClick={() => handleToggleEstado(u)}
                      title={esElAdminActual ? 'No puede suspender su propia cuenta' : esActivo ? 'Suspender/banear cuenta' : 'Reactivar cuenta'}
                      className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                        esElAdminActual
                          ? 'opacity-40 cursor-not-allowed bg-night-900 border-night-border text-slate-400'
                          : esActivo
                          ? 'bg-rose-950/70 hover:bg-rose-900 text-rose-200 border-rose-800 hover:border-rose-600'
                          : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border-emerald-700 hover:border-emerald-500'
                      }`}
                    >
                      {esActivo ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-rose-400" />
                          <span>Banear / Desactivar</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Reactivar Cuenta</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAbrirModalPermiso(u)}
                      className="min-h-[40px] px-3.5 py-2 bg-night-900 hover:bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:border-amber-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Otorgar Permiso</span>
                    </button>
                  </div>
                </div>

                {/* Sección de Permisos Especiales Asociados (TB_PermisosUsuarios) */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Permisos Especiales Acreditados ({u.permisos?.length || 0})</span>
                    </span>
                  </div>

                  {tienePermisos ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {u.permisos!.map((perm) => (
                        <div
                          key={perm.id_Permiso || perm.id}
                          className="bg-night-900/95 border border-night-border rounded-xl p-3 flex flex-col justify-between gap-2 shadow-inner"
                        >
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-xs font-bold text-white leading-tight">
                                {perm.tipoPermiso}
                              </span>
                              <span className="text-[10px] font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded shrink-0">
                                {perm.estado}
                              </span>
                            </div>

                            <p className="text-[11px] font-mono text-slate-300">
                              Doc: <strong className="text-white">{perm.numeroDocumento}</strong>
                            </p>
                            <p className="text-[11px] font-mono text-slate-400">
                              Expira: {new Date(perm.fechaExpiracion).toLocaleDateString('es-CL')}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-night-border flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const confirmacion = window.confirm(
                                  `¿Desea revocar el permiso "${perm.tipoPermiso}" al usuario?`
                                );
                                if (confirmacion) {
                                  revocarPermisoMutation.mutate({
                                    usuarioId: idUsuario,
                                    permisoId: perm.id_Permiso || perm.id || 0
                                  });
                                }
                              }}
                              className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 py-1 px-2 rounded hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Revocar Permiso</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-night-900/60 p-2.5 rounded-xl border border-night-border">
                      El usuario no posee permisos especiales adicionales registrados en TB_PermisosUsuarios.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Otorgar Permiso Especial */}
      <Modal
        isOpen={modalPermisoAbierto}
        onClose={() => setModalPermisoAbierto(false)}
        title={`Otorgar Permiso Especial a ${usuarioSeleccionado?.nombreCompleto || 'Usuario'}`}
      >
        <form onSubmit={handleGuardarPermiso} className="space-y-4">
          <p className="text-xs text-slate-300">
            Los permisos especiales se persisten en <strong className="text-amber-400">TB_PermisosUsuarios</strong> y
            habilitan al usuario a adquirir artículos con restricción de edad (+18) o de uso exclusivo para Fuerzas de Orden y Seguridad.
          </p>

          {permisoError && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{permisoError}</span>
            </div>
          )}

          <div>
            <label htmlFor="tipo-permiso-select" className="block text-xs font-bold uppercase text-slate-200 mb-1.5">
              Tipo de Permiso Regulado <span className="text-amber-400">*</span>
            </label>
            <select
              id="tipo-permiso-select"
              value={tipoPermiso}
              onChange={(e) => setTipoPermiso(e.target.value)}
              className="w-full p-2.5 bg-night-900 border border-night-border rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
            >
              {PRESET_PERMISOS.map((p) => (
                <option key={p.tipo} value={p.tipo} className="bg-night-900 text-white">
                  {p.tipo}
                </option>
              ))}
              <option value="OTRO" className="bg-night-900 text-white">Otro Permiso Personalizado...</option>
            </select>
          </div>

          {tipoPermiso === 'OTRO' && (
            <div>
              <label htmlFor="tipo-permiso-custom" className="block text-xs font-bold uppercase text-slate-200 mb-1.5">
                Especifique Tipo de Permiso <span className="text-amber-400">*</span>
              </label>
              <input
                id="tipo-permiso-custom"
                type="text"
                value={tipoPermisoCustom}
                onChange={(e) => setTipoPermisoCustom(e.target.value)}
                placeholder="Ej. Certificación Balística Nivel III"
                className="w-full p-2.5 bg-night-900 border border-night-border rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="num-documento-input" className="block text-xs font-bold uppercase text-slate-200 mb-1.5">
              Número de Documento / Licencia <span className="text-amber-400">*</span>
            </label>
            <input
              id="num-documento-input"
              type="text"
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
              placeholder="Ej. LIC-98765432 o CRED-FFAA-2026"
              className="w-full p-2.5 bg-night-900 border border-night-border rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400 font-mono"
              required
            />
          </div>

          <div>
            <label htmlFor="fecha-expiracion-input" className="block text-xs font-bold uppercase text-slate-200 mb-1.5">
              Fecha de Expiración del Permiso <span className="text-amber-400">*</span>
            </label>
            <input
              id="fecha-expiracion-input"
              type="date"
              value={fechaExpiracion}
              onChange={(e) => setFechaExpiracion(e.target.value)}
              className="w-full p-2.5 bg-night-900 border border-night-border rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-night-border">
            <button
              type="button"
              onClick={() => setModalPermisoAbierto(false)}
              className="px-4 py-2 bg-night-800 hover:bg-night-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={otorgarPermisoMutation.isPending}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)] disabled:opacity-50"
            >
              {otorgarPermisoMutation.isPending ? 'Concediendo...' : 'Conceder Permiso Especial'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
