import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wrench,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  PlusCircle,
  Truck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { servicioTecnicoService } from '../../services/servicioTecnicoService';
import { pedidoService } from '../../services/pedidoService';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import type { ServicioTecnico, Pedido, Usuario } from '../../types';

export const TecnicoPanelPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'servicios' | 'pedidos'>('servicios');
  const [filtroEstado, setFiltroEstado] = useState<string>('');

  // Estados para modal de nota de seguimiento
  const [ticketSeleccionado, setTicketSeleccionado] = useState<ServicioTecnico | null>(null);
  const [notaTexto, setNotaTexto] = useState('');
  const [modalNotaAbierto, setModalNotaAbierto] = useState(false);

  // Estados para modal de costo estimado
  const [nuevoCosto, setNuevoCosto] = useState<string>('');
  const [modalCostoAbierto, setModalCostoAbierto] = useState(false);

  // Estado para expandir/plegar notas de bitácora por ticket
  const [bitacorasExpandidas, setBitacorasExpandidas] = useState<Record<number, boolean>>({});

  const toggleBitacora = (ticketId: number) => {
    setBitacorasExpandidas((prev) => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };

  // Consulta de técnicos disponibles para asignación
  const { data: tecnicos = [] } = useQuery<Usuario[]>({
    queryKey: ['usuarios-tecnicos'],
    queryFn: () => authService.getTecnicos()
  });

  // Consulta de Servicios Técnicos con actualización periódica
  const {
    data: servicios = [],
    isLoading: loadingServicios,
    isError: errorServicios,
    refetch: refetchServicios
  } = useQuery<ServicioTecnico[]>({
    queryKey: ['tecnico-servicios', { estado: filtroEstado }],
    queryFn: () => servicioTecnicoService.getServicios({ estado: filtroEstado || undefined }),
    refetchInterval: 4000
  });

  // Consulta de Pedidos para Despacho
  const {
    data: pedidos = [],
    isLoading: loadingPedidos,
    isError: errorPedidos,
    refetch: refetchPedidos
  } = useQuery<Pedido[]>({
    queryKey: ['tecnico-pedidos'],
    queryFn: () => pedidoService.getPedidos(),
    refetchInterval: 4000
  });

  // Mutación para actualizar estado de servicio
  const actualizarServicioMutation = useMutation({
    mutationFn: ({ id, estado, tecnicoId, costoEstimado }: { id: number; estado?: string; tecnicoId?: number; costoEstimado?: number }) =>
      servicioTecnicoService.actualizarServicio(id, { estado, tecnicoId, costoEstimado }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tecnico-servicios'] });
      queryClient.invalidateQueries({ queryKey: ['cliente-servicios'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics-servicios'] });
      setModalCostoAbierto(false);
    }
  });

  // Mutación para agregar nota de seguimiento
  const agregarNotaMutation = useMutation({
    mutationFn: ({ id, notas }: { id: number; notas: string }) =>
      servicioTecnicoService.agregarSeguimiento(id, { notas }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tecnico-servicios'] });
      queryClient.invalidateQueries({ queryKey: ['cliente-servicios'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics-servicios'] });
      setModalNotaAbierto(false);
      setNotaTexto('');
    }
  });

  // Mutación para actualizar estado de pedido
  const actualizarPedidoMutation = useMutation({
    mutationFn: ({ id, estadoId }: { id: number; estadoId: number }) =>
      pedidoService.actualizarEstadoPedido(id, estadoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tecnico-pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['cliente-pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics-pedidos'] });
    }
  });

  const getEstadoBadge = (nombre?: string) => {
    switch (nombre) {
      case 'Finalizado':
      case 'Completado':
      case 'Pagado':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm';
      case 'En Reparacion':
      case 'En Reparación':
      case 'Enviado':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-sm';
      case 'En Revision':
      case 'En Revisión':
      case 'En Proceso':
      case 'Pendiente':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm';
      case 'Cancelado':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-sm';
      default:
        return 'bg-night-800 text-slate-300 border-night-border';
    }
  };

  const handleAsignarATecnico = (servicioId: number) => {
    if (!user) return;
    actualizarServicioMutation.mutate({
      id: servicioId,
      tecnicoId: user.id_Usuario
    });
  };

  const handleCambiarEstado = (servicioId: number, nuevoEstado: string) => {
    actualizarServicioMutation.mutate({
      id: servicioId,
      estado: nuevoEstado
    });
  };

  const handleGuardarNota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSeleccionado || !notaTexto.trim()) return;
    agregarNotaMutation.mutate({
      id: ticketSeleccionado.id,
      notas: notaTexto.trim()
    });
  };

  const handleGuardarCosto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSeleccionado) return;
    const costo = Number(nuevoCosto);
    if (isNaN(costo) || costo < 0) return;
    actualizarServicioMutation.mutate({
      id: ticketSeleccionado.id,
      costoEstimado: costo
    });
  };

  return (
    <div className="space-y-8">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-night-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded-full shadow-sm">
              Panel de Especialista Técnico
            </span>
            <span className="text-xs text-slate-300 font-semibold">Operador: <strong className="text-white">{user?.nombreCompleto}</strong></span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2.5">
            <Wrench className="w-7 h-7 text-amber-400" aria-hidden="true" />
            <span>Módulo de Soporte y Servicios Técnicos</span>
          </h1>
          <p className="text-sm text-slate-300 mt-0.5">
            Diagnóstico, asignación técnica, bitácora de mantenimiento y despacho de pedidos
          </p>
        </div>
      </div>

      {/* Pestañas de Navegación Técnica Estandarizadas */}
      <div className="flex items-center gap-2 border-b border-night-border">
        <button
          type="button"
          onClick={() => setActiveTab('servicios')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all min-h-[44px] rounded-t-lg ${
            activeTab === 'servicios'
              ? 'border-amber-400 text-amber-400 bg-night-850/80'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-night-850/40'
          }`}
        >
          <Wrench className="w-4 h-4" aria-hidden="true" />
          <span>Tickets de Servicio Técnico ({servicios.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pedidos')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all min-h-[44px] rounded-t-lg ${
            activeTab === 'pedidos'
              ? 'border-amber-400 text-amber-400 bg-night-850/80'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-night-850/40'
          }`}
        >
          <Truck className="w-4 h-4" aria-hidden="true" />
          <span>Despacho y Estado de Pedidos ({pedidos.length})</span>
        </button>
      </div>

      {/* PESTAÑA 1: TICKETS DE SERVICIO TÉCNICO */}
      {activeTab === 'servicios' && (
        <div className="space-y-6">
          {/* Barra de Filtro de Estado */}
          <div className="flex flex-wrap items-center gap-3 bg-night-850/95 p-4 rounded-2xl border border-night-border shadow-md">
            <span className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-amber-400" />
              <span>Filtrar por Estado:</span>
            </span>

            {['', 'En Revisión', 'En Reparación', 'Finalizado', 'Cancelado'].map((st) => (
              <button
                key={st || 'todos'}
                type="button"
                onClick={() => setFiltroEstado(st)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  filtroEstado === st
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 font-black shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'bg-night-900 text-slate-300 border-night-border hover:bg-night-800 hover:border-amber-500/40'
                }`}
              >
                {st || 'Todos los Tickets'}
              </button>
            ))}
          </div>

          {loadingServicios && (
            <div className="py-12">
              <LoadingSpinner text="Cargando cola de tickets de servicio técnico..." />
            </div>
          )}

          {errorServicios && (
            <ErrorAlert
              title="Error al cargar servicios técnicos"
              message="No fue posible consultar la base de datos de tickets."
              onRetry={refetchServicios}
            />
          )}

          {!loadingServicios && !errorServicios && servicios.length === 0 && (
            <EmptyState
              title="No hay tickets técnicos con el filtro actual"
              description="Seleccione 'Todos los Tickets' o espere el ingreso de nuevas solicitudes de clientes."
            />
          )}

          {!loadingServicios && !errorServicios && servicios.length > 0 && (
            <div className="space-y-5">
              {servicios.map((srv) => (
                <div
                  key={srv.id}
                  className="bg-night-850/95 border border-night-border rounded-2xl p-5 space-y-4 shadow-lg hover:border-amber-500/40 transition-all"
                >
                  {/* Encabezado del Ticket */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-night-border pb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-base font-black text-amber-400">
                        Ticket ST-#{srv.id}
                      </span>
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getEstadoBadge(
                          srv.estado
                        )}`}
                      >
                        {srv.estado}
                      </span>
                      <span className="text-xs text-slate-300 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-400/80" />
                        <span>Ingresado el {new Date(srv.fechaIngreso).toLocaleString('es-CL')}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-semibold">Costo Estimado:</span>
                      <span className="text-amber-400 font-black text-sm">
                        ${Number(srv.costoEstimado).toLocaleString('es-CL')} CLP
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTicketSeleccionado(srv);
                          setNuevoCosto(String(srv.costoEstimado));
                          setModalCostoAbierto(true);
                        }}
                        className="text-xs text-amber-300 hover:text-white underline p-1 focus-visible:outline-2 focus-visible:outline-amber-400 rounded font-semibold"
                      >
                        Modificar Costo
                      </button>
                    </div>
                  </div>

                  {/* Datos del Cliente y Problema */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-4 bg-night-900/90 p-3.5 rounded-xl border border-night-border text-xs space-y-1.5 shadow-inner">
                      <span className="font-bold text-amber-400 uppercase tracking-wider block">
                        Cliente Solicitante
                      </span>
                      <p className="font-bold text-white text-sm">
                        {srv.cliente ? `${srv.cliente.nombre} ${srv.cliente.apellido}` : `Cliente #${srv.clienteId}`}
                      </p>
                      <p className="text-slate-300 font-mono text-[11px]">
                        {srv.cliente?.email || srv.cliente?.correo || 'Sin correo disponible'}
                      </p>
                    </div>

                    <div className="sm:col-span-8 bg-night-900/90 p-3.5 rounded-xl border border-night-border text-xs space-y-1.5 shadow-inner">
                      <span className="font-bold text-amber-400 uppercase tracking-wider block">
                        Diagnóstico / Problema Reportado
                      </span>
                      <p className="text-slate-100 text-sm leading-relaxed">
                        {srv.descripcionProblema}
                      </p>
                    </div>
                  </div>

                  {/* Asignación Técnica y Controles de Estado */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-night-border">
                    <div className="flex items-center gap-2 text-xs text-slate-200 flex-wrap">
                      <UserCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="font-bold text-slate-300">Técnico:</span>
                      <select
                        value={srv.tecnicoId || ''}
                        onChange={(e) => {
                          const tecId = Number(e.target.value);
                          if (tecId > 0) {
                            actualizarServicioMutation.mutate({ id: srv.id, tecnicoId: tecId });
                          }
                        }}
                        aria-label={`Asignar técnico para ticket ST-#${srv.id}`}
                        className="bg-night-900 border border-night-border text-xs text-white rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-cyan-400"
                      >
                        <option value="" className="bg-night-900 text-white">-- Sin Asignar --</option>
                        {tecnicos.map((t) => (
                          <option key={t.id_Usuario || t.id} value={t.id_Usuario || t.id} className="bg-night-900 text-white">
                            {t.nombreCompleto}
                          </option>
                        ))}
                      </select>

                      {(!srv.tecnicoId || srv.tecnicoId !== user?.id_Usuario) && (
                        <button
                          type="button"
                          onClick={() => handleAsignarATecnico(srv.id)}
                          className="px-2.5 py-1.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/25 rounded-lg font-bold transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400"
                        >
                          Asignármelo a mí
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Selector directo de estado */}
                      <div className="flex items-center gap-1.5 bg-night-900 border border-night-border rounded-xl px-2.5 py-1">
                        <span className="text-[11px] text-slate-400 font-bold">Estado:</span>
                        <select
                          value={srv.estado}
                          onChange={(e) => handleCambiarEstado(srv.id, e.target.value)}
                          aria-label={`Actualizar estado del ticket ST-#${srv.id}`}
                          className="bg-transparent text-xs font-black text-amber-400 focus:outline-hidden cursor-pointer"
                        >
                          <option value="En Revisión" className="bg-night-900 text-white">En Revisión</option>
                          <option value="En Reparación" className="bg-night-900 text-white">En Reparación</option>
                          <option value="Finalizado" className="bg-night-900 text-white">Finalizado</option>
                          <option value="Cancelado" className="bg-night-900 text-white">Cancelado</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setTicketSeleccionado(srv);
                          setNotaTexto('');
                          setModalNotaAbierto(true);
                        }}
                        className="px-3 py-1.5 bg-night-800 hover:bg-night-700 text-slate-200 border border-night-border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Agregar Nota</span>
                      </button>

                      {(srv.estado === 'En Revisión' || srv.estado === 'En Revision' || srv.estado === 'En Proceso') && (
                        <button
                          type="button"
                          onClick={() => handleCambiarEstado(srv.id, 'En Reparación')}
                          className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black rounded-xl text-xs transition-colors shadow-sm"
                        >
                          Iniciar Reparación
                        </button>
                      )}

                      {(srv.estado === 'En Reparación' || srv.estado === 'En Reparacion') && (
                        <button
                          type="button"
                          onClick={() => handleCambiarEstado(srv.id, 'Finalizado')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs transition-colors shadow-sm"
                        >
                          Marcar Finalizado
                        </button>
                      )}

                      {srv.estado !== 'Cancelado' && srv.estado !== 'Finalizado' && (
                        <button
                          type="button"
                          onClick={() => handleCambiarEstado(srv.id, 'Cancelado')}
                          className="px-3 py-1.5 bg-rose-950/60 text-rose-300 border border-rose-800 hover:bg-rose-900/80 rounded-xl text-xs font-bold transition-colors"
                        >
                          Cancelar Ticket
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bitácora de Seguimiento Plegable */}
                  {srv.seguimientos && srv.seguimientos.length > 0 && (() => {
                    const seguimientos = srv.seguimientos;
                    const estaExpandido = !!bitacorasExpandidas[srv.id];
                    const notasOrdenadas = [...seguimientos].sort(
                      (a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime()
                    );
                    const notasVisibles = estaExpandido ? notasOrdenadas : [notasOrdenadas[0]];

                    return (
                      <div className="pt-2 border-t border-night-border space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[11px] font-bold uppercase text-amber-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Bitácora y Notas Registradas ({seguimientos.length})</span>
                          </span>

                          {seguimientos.length > 1 && (
                            <button
                              type="button"
                              onClick={() => toggleBitacora(srv.id)}
                              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 p-1 rounded hover:bg-night-800 transition-colors focus-visible:outline-2 focus-visible:outline-amber-400"
                            >
                              {estaExpandido ? (
                                <>
                                  <ChevronUp className="w-3.5 h-3.5" />
                                  <span>Plegar bitácora</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3.5 h-3.5" />
                                  <span>Ver historial completo ({seguimientos.length} notas)</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          {notasVisibles.map((seg, idx) => (
                            <div
                              key={seg.id}
                              className="text-xs bg-night-900/90 p-2.5 rounded-xl border-l-2 border-amber-400 text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 shadow-inner"
                            >
                              <div className="flex items-center gap-2">
                                {!estaExpandido && idx === 0 && seguimientos.length > 1 && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30 shrink-0">
                                    Nota Reciente
                                  </span>
                                )}
                                <span>{seg.notas}</span>
                              </div>
                              <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                                {new Date(seg.fechaRegistro).toLocaleString('es-CL')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: DESPACHO DE PEDIDOS */}
      {activeTab === 'pedidos' && (
        <div className="space-y-4">
          {loadingPedidos && (
            <div className="py-12">
              <LoadingSpinner text="Cargando cola de pedidos..." />
            </div>
          )}

          {errorPedidos && (
            <ErrorAlert
              title="Error al cargar pedidos"
              message="No fue posible consultar los pedidos de clientes."
              onRetry={refetchPedidos}
            />
          )}

          {!loadingPedidos && !errorPedidos && pedidos.length === 0 && (
            <EmptyState
              title="No hay pedidos registrados en el sistema"
              description="Los pedidos generados por clientes aparecerán aquí."
            />
          )}

          {!loadingPedidos && !errorPedidos && pedidos.length > 0 && (
            <div className="space-y-4">
              {pedidos.map((ped) => (
                <div
                  key={ped.id}
                  className="bg-night-850/95 border border-night-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg hover:border-amber-500/40 transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-sm font-bold text-amber-400">
                        Pedido #{ped.id}
                      </span>
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getEstadoBadge(
                          ped.estado?.nombre || ped.estadoPedido
                        )}`}
                      >
                        {ped.estado?.nombre || ped.estadoPedido || 'Pendiente'}
                      </span>
                      <span className="text-xs text-slate-200 font-bold">
                        Cliente: {ped.usuario ? (ped.usuario.nombreCompleto || `${ped.usuario.nombre} ${ped.usuario.apellido}`) : `ID #${ped.usuarioId}`}
                      </span>
                      {ped.factura && (
                        <span className="text-xs font-mono bg-night-900 text-cyan-300 border border-cyan-800/40 px-2 py-0.5 rounded">
                          {ped.factura.numeroFactura}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300">
                      Fecha: {new Date(ped.fechaPedido).toLocaleString('es-CL')} &bull; {ped.detalles?.length || 0} artículos &bull; {ped.metodoEntrega || 'Despacho a Domicilio'}
                    </p>
                    {ped.direccionEnvio && (
                      <p className="text-xs text-slate-300">
                        Destino: <span className="text-amber-300 font-mono">{ped.direccionEnvio}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                    <div className="text-right shrink-0">
                      <span className="text-xs text-slate-400 block font-semibold">Total</span>
                      <span className="text-base font-black text-amber-400">
                        ${Number(ped.total).toLocaleString('es-CL')} CLP
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={ped.estadoId}
                        onChange={(e) =>
                          actualizarPedidoMutation.mutate({
                            id: ped.id,
                            estadoId: Number(e.target.value)
                          })
                        }
                        aria-label={`Cambiar estado del pedido #${ped.id}`}
                        className="bg-night-900 border border-night-border text-xs font-bold text-white rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                      >
                        <option value={1} className="bg-night-900 text-white">1. Pendiente</option>
                        <option value={3} className="bg-night-900 text-white">3. Enviado</option>
                        <option value={2} className="bg-night-900 text-white">2. Completado</option>
                        <option value={4} className="bg-night-900 text-white">4. Cancelado</option>
                      </select>

                      {(ped.estadoId === 1 || ped.estadoPedido === 'Pendiente') && (
                        <button
                          type="button"
                          onClick={() => actualizarPedidoMutation.mutate({ id: ped.id, estadoId: 3 })}
                          disabled={actualizarPedidoMutation.isPending}
                          className="min-h-[40px] px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                          title="Cambiar estado a Enviado"
                        >
                          <Truck className="w-4 h-4" />
                          <span>Despachar</span>
                        </button>
                      )}

                      {(ped.estadoId === 3 || ped.estadoPedido === 'Enviado') && (
                        <button
                          type="button"
                          onClick={() => actualizarPedidoMutation.mutate({ id: ped.id, estadoId: 2 })}
                          disabled={actualizarPedidoMutation.isPending}
                          className="min-h-[40px] px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                          title="Marcar como Completado/Entregado"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Entregado</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal para Agregar Nota de Seguimiento */}
      <Modal
        isOpen={modalNotaAbierto}
        onClose={() => setModalNotaAbierto(false)}
        title={`Agregar Nota a Ticket ST-#${ticketSeleccionado?.id}`}
      >
        <form onSubmit={handleGuardarNota} className="space-y-4">
          <p className="text-xs text-slate-300">
            Esta nota quedará registrada en la bitácora con marca de tiempo y será visible para el cliente y el equipo técnico.
          </p>

          <div>
            <label htmlFor="nota-input" className="block text-xs font-bold uppercase text-slate-200 mb-1.5">
              Observaciones del Técnico <span className="text-amber-400">*</span>
            </label>
            <textarea
              id="nota-input"
              rows={4}
              value={notaTexto}
              onChange={(e) => setNotaTexto(e.target.value)}
              placeholder="Ej. Inspección interna completada. Repuesto de costura MOLLE instalado con éxito..."
              className="w-full p-3 bg-night-900 border border-night-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setModalNotaAbierto(false)}
              className="min-h-[44px] px-4 py-2 bg-night-800 hover:bg-night-700 text-slate-200 border border-night-border rounded-xl text-sm font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={agregarNotaMutation.isPending}
              className="min-h-[44px] px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] disabled:opacity-50"
            >
              {agregarNotaMutation.isPending ? 'Guardando...' : 'Guardar Nota'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para Modificar Costo Estimado */}
      <Modal
        isOpen={modalCostoAbierto}
        onClose={() => setModalCostoAbierto(false)}
        title={`Ajustar Costo Estimado - Ticket ST-#${ticketSeleccionado?.id}`}
      >
        <form onSubmit={handleGuardarCosto} className="space-y-4">
          <div>
            <label htmlFor="costo-input" className="block text-xs font-bold uppercase text-slate-200 mb-1.5">
              Costo Estimado en CLP ($)
            </label>
            <input
              id="costo-input"
              type="number"
              min="0"
              step="500"
              value={nuevoCosto}
              onChange={(e) => setNuevoCosto(e.target.value)}
              className="w-full p-2.5 bg-night-900 border border-night-border rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setModalCostoAbierto(false)}
              className="min-h-[44px] px-4 py-2 bg-night-800 hover:bg-night-700 text-slate-200 border border-night-border rounded-xl text-sm font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={actualizarServicioMutation.isPending}
              className="min-h-[44px] px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] disabled:opacity-50"
            >
              Actualizar Costo
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
