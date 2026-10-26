import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  Wrench,
  Clock,
  AlertCircle,
  FileText,
  Plus,
  ChevronDown,
  ChevronUp,
  Receipt,
  User,
  Send,
  Sparkles,
  Tag
} from 'lucide-react';
import { pedidoService } from '../../services/pedidoService';
import { servicioTecnicoService } from '../../services/servicioTecnicoService';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import type { Pedido, ServicioTecnico, TipoServicio } from '../../types';

export const ClientePanelPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'pedidos' | 'servicios'>(
    tabParam === 'servicios' ? 'servicios' : 'pedidos'
  );

  useEffect(() => {
    if (tabParam === 'servicios') {
      setActiveTab('servicios');
    }
  }, [tabParam]);

  const [pedidoExpandido, setPedidoExpandido] = useState<number | null>(null);
  const [modalNuevoServicio, setModalNuevoServicio] = useState(false);
  const [tipoServicioSeleccionadoId, setTipoServicioSeleccionadoId] = useState<number>(1);
  const [tipoEquipo, setTipoEquipo] = useState('Personalización de Parches');
  const [descripcionProblema, setDescripcionProblema] = useState('');

  // Estados para detalles de parches custom (TB_DetallesParchesCustom)
  const [textoPersonalizado, setTextoPersonalizado] = useState('OPE-BÚFALO / A+');
  const [dimensiones, setDimensiones] = useState('7x5 cm');
  const [tipoBordado, setTipoBordado] = useState('Alta Definición con Velcro');
  const [cantidadParches, setCantidadParches] = useState(2);
  const [observacionesDiseno, setObservacionesDiseno] = useState('Fondo negro, letras en hilo gris reflectante.');

  // Control de bitácoras expandidas/plegadas (igual que en el panel de administración / técnico)
  const [bitacorasExpandidas, setBitacorasExpandidas] = useState<Record<number, boolean>>({});

  const toggleBitacora = (ticketId: number) => {
    setBitacorasExpandidas((prev) => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };

  const [errorForm, setErrorForm] = useState<string | null>(null);

  // Consulta de Tipos de Servicio Disponibles (TB_TiposServicio)
  const { data: tiposServicio = [] } = useQuery<TipoServicio[]>({
    queryKey: ['tipos-servicio'],
    queryFn: () => servicioTecnicoService.getTiposServicio()
  });

  // Consulta de Pedidos del Cliente
  const {
    data: pedidos = [],
    isLoading: loadingPedidos,
    isError: errorPedidos,
    refetch: refetchPedidos
  } = useQuery<Pedido[]>({
    queryKey: ['cliente-pedidos'],
    queryFn: () => pedidoService.getPedidos()
  });

  // Consulta de Solicitudes de Servicio Técnico
  const {
    data: servicios = [],
    isLoading: loadingServicios,
    isError: errorServicios,
    refetch: refetchServicios
  } = useQuery<ServicioTecnico[]>({
    queryKey: ['cliente-servicios'],
    queryFn: () => servicioTecnicoService.getServicios()
  });

  // Mutación para crear nueva solicitud de servicio técnico
  const crearServicioMutation = useMutation({
    mutationFn: (payload: {
      descripcionProblema: string;
      tipoServicioId?: number;
      textoPersonalizado?: string;
      dimensiones?: string;
      tipoBordado?: string;
      cantidad?: number;
      observacionesDiseno?: string;
      costoEstimado?: number;
    }) => servicioTecnicoService.crearServicio(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-servicios'] });
      queryClient.invalidateQueries({ queryKey: ['tecnico-servicios'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics-servicios'] });
      setModalNuevoServicio(false);
      setDescripcionProblema('');
      setErrorForm(null);
    },
    onError: (err: any) => {
      setErrorForm(err.message || 'Error al enviar la solicitud técnica.');
    }
  });

  const handleCrearServicio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcionProblema.trim()) {
      setErrorForm('Debe describir el problema o requerimiento de su equipo.');
      return;
    }

    const tipoEncontrado = tiposServicio.find((t) => (t.id_TipoServicio || t.id) === tipoServicioSeleccionadoId);
    const esParche = tipoEncontrado?.nombre?.toLowerCase().includes('parche') || tipoEquipo.toLowerCase().includes('parche');

    const textoCompleto = `[${tipoEquipo}] ${descripcionProblema.trim()}`;
    crearServicioMutation.mutate({
      descripcionProblema: textoCompleto,
      tipoServicioId: tipoServicioSeleccionadoId,
      costoEstimado: tipoEncontrado?.costoBase ? Number(tipoEncontrado.costoBase) : undefined,
      textoPersonalizado: esParche ? textoPersonalizado : undefined,
      dimensiones: esParche ? dimensiones : undefined,
      tipoBordado: esParche ? tipoBordado : undefined,
      cantidad: esParche ? cantidadParches : undefined,
      observacionesDiseno: esParche ? observacionesDiseno : undefined
    });
  };

  const getEstadoBadge = (nombre?: string) => {
    switch (nombre) {
      case 'Pagado':
      case 'Completado':
      case 'Finalizado':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm';
      case 'Enviado':
      case 'En Reparacion':
      case 'En Reparación':
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

  return (
    <div className="space-y-8">
      {/* Encabezado del Panel de Cliente */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-night-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full shadow-sm">
              Panel del Cliente
            </span>
            <span className="text-xs text-slate-400 font-mono">ID Usuario: #{user?.id_Usuario}</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            Mis Pedidos y Soporte Técnico
          </h1>
          <p className="text-sm text-slate-300 mt-0.5">
            Historial de compras tácticas, facturación correlativa y estado de servicio técnico
          </p>
        </div>

        {activeTab === 'servicios' && (
          <button
            type="button"
            onClick={() => setModalNuevoServicio(true)}
            className="min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0 focus-visible:outline-2 focus-visible:outline-white"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            <span>Nueva Solicitud Técnica</span>
          </button>
        )}
      </div>

      {/* Selector de Pestañas Estandarizado */}
      <div className="flex items-center gap-2 border-b border-night-border">
        <button
          type="button"
          onClick={() => setActiveTab('pedidos')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all min-h-[44px] rounded-t-lg ${
            activeTab === 'pedidos'
              ? 'border-amber-400 text-amber-400 bg-night-850/80'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-night-850/40'
          }`}
        >
          <ShoppingBag className="w-4 h-4" aria-hidden="true" />
          <span>Historial de Pedidos ({pedidos.length})</span>
        </button>

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
          <span>Servicios Técnicos ({servicios.length})</span>
        </button>
      </div>

      {/* PESTAÑA 1: HISTORIAL DE PEDIDOS */}
      {activeTab === 'pedidos' && (
        <div className="space-y-4">
          {loadingPedidos && (
            <div className="py-12">
              <LoadingSpinner text="Consultando sus pedidos en el sistema..." />
            </div>
          )}

          {errorPedidos && (
            <ErrorAlert
              title="Error al cargar pedidos"
              message="No se pudo obtener el historial de compras."
              onRetry={refetchPedidos}
            />
          )}

          {!loadingPedidos && !errorPedidos && pedidos.length === 0 && (
            <EmptyState
              title="Aún no registra pedidos"
              description="Explore nuestro catálogo de indumentaria y equipamiento táctico para realizar su primera compra."
            />
          )}

          {!loadingPedidos && !errorPedidos && pedidos.length > 0 && (
            <div className="space-y-4">
              {pedidos.map((ped) => {
                const expandido = pedidoExpandido === ped.id;
                return (
                  <div
                    key={ped.id}
                    className="bg-night-850/95 border border-night-border rounded-2xl overflow-hidden transition-all shadow-md hover:border-amber-500/40"
                  >
                    {/* Encabezado del Pedido */}
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono text-sm font-bold text-amber-400">
                            Pedido #{ped.id}
                          </span>
                          <span
                            className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getEstadoBadge(
                              ped.estado?.nombre
                            )}`}
                          >
                            {ped.estado?.nombre || 'Pendiente'}
                          </span>
                          {ped.factura && (
                            <span className="text-xs font-mono bg-night-900 text-cyan-300 border border-cyan-800/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Receipt className="w-3 h-3 text-cyan-400" aria-hidden="true" />
                              <span>{ped.factura.numeroFactura}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-400/80" aria-hidden="true" />
                          <span>{new Date(ped.fechaPedido).toLocaleString('es-CL')}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block font-semibold">Total Pagado</span>
                          <span className="text-lg font-black text-amber-400">
                            ${Number(ped.total).toLocaleString('es-CL')} CLP
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPedidoExpandido(expandido ? null : ped.id)}
                          className="min-h-[44px] min-w-[44px] p-2 bg-night-800 hover:bg-night-700 text-slate-200 border border-night-border rounded-xl flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-amber-400"
                          aria-label={expandido ? 'Ocultar detalle' : 'Ver detalle'}
                          aria-expanded={expandido}
                        >
                          {expandido ? <ChevronUp className="w-5 h-5 text-amber-400" /> : <ChevronDown className="w-5 h-5 text-amber-400" />}
                        </button>
                      </div>
                    </div>

                    {/* Detalle Desplegable con los Productos Comprados */}
                    {expandido && (
                      <div className="border-t border-night-border bg-night-900/90 p-5 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Detalle de Artículos ({ped.detalles?.length || 0})</span>
                        </h4>

                        <div className="divide-y divide-night-border">
                          {ped.detalles?.map((det) => (
                            <div key={det.id} className="py-2.5 flex items-center justify-between text-sm">
                              <div>
                                <span className="font-bold text-white">
                                  {det.producto?.nombre || `Producto #${det.productoId}`}
                                </span>
                                <span className="text-xs text-slate-300 block mt-0.5">
                                  Cantidad: {det.cantidad} &times; ${Number(det.precioUnitario).toLocaleString('es-CL')}
                                </span>
                              </div>
                              <span className="font-black text-amber-300">
                                ${Number(det.subtotal).toLocaleString('es-CL')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: SERVICIOS TÉCNICOS */}
      {activeTab === 'servicios' && (
        <div className="space-y-4">
          {loadingServicios && (
            <div className="py-12">
              <LoadingSpinner text="Consultando sus requerimientos técnicos..." />
            </div>
          )}

          {errorServicios && (
            <ErrorAlert
              title="Error al cargar servicios técnicos"
              message="No se pudieron consultar los tickets técnicos registrados."
              onRetry={refetchServicios}
            />
          )}

          {!loadingServicios && !errorServicios && servicios.length === 0 && (
            <EmptyState
              title="No registra servicios técnicos activos"
              description="Si requiere mantención, reparación o ajuste para su equipo táctico, genere una nueva solicitud."
              actionText="Crear Solicitud Técnica"
              onAction={() => setModalNuevoServicio(true)}
            />
          )}

          {!loadingServicios && !errorServicios && servicios.length > 0 && (
            <div className="space-y-5">
              {servicios.map((srv) => {
                const patchDetail = srv.seguimientos?.find(
                  (seg) => seg.textoPersonalizado || seg.tipoBordado
                );
                const seguimientos = srv.seguimientos || [];
                const estaExpandido = !!bitacorasExpandidas[srv.id];
                const notasOrdenadas = [...seguimientos].sort(
                  (a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime()
                );
                const notasVisibles = estaExpandido ? notasOrdenadas : [notasOrdenadas[0]].filter(Boolean);

                return (
                  <div
                    key={srv.id}
                    className="bg-night-850/95 border border-night-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg hover:border-amber-500/40 transition-all"
                  >
                    {/* Encabezado del Ticket Detallado */}
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

                        {/* Tipo de Servicio Oficial (TB_TiposServicio) */}
                        <span className="text-xs font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <Tag className="w-3 h-3 text-purple-400" />
                          <span>{srv.tipoServicio?.nombre || 'Servicio Técnico Especializado'}</span>
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
                      </div>
                    </div>

                    {/* Ficha Diagnóstico y Técnico Especialista Asignado */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                      <div className="sm:col-span-8 bg-night-900/90 p-4 rounded-xl border border-night-border text-xs space-y-1.5 shadow-inner">
                        <span className="font-bold text-amber-400 uppercase tracking-wider block">
                          Diagnóstico / Requerimiento Reportado
                        </span>
                        <p className="text-slate-100 text-sm leading-relaxed">
                          {srv.descripcionProblema}
                        </p>
                      </div>

                      <div className="sm:col-span-4 bg-night-900/90 p-4 rounded-xl border border-night-border text-xs space-y-1.5 shadow-inner">
                        <span className="font-bold text-cyan-400 uppercase tracking-wider block flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Técnico Responsable</span>
                        </span>
                        {srv.tecnico ? (
                          <>
                            <p className="font-bold text-white text-sm">
                              {srv.tecnico.nombreCompleto || `${srv.tecnico.nombre || ''} ${srv.tecnico.apellido || ''}`.trim()}
                            </p>
                            <p className="text-slate-400 font-mono text-[11px]">
                              {srv.tecnico.correo || srv.tecnico.email || 'tecnico@bufalos.cl'}
                            </p>
                          </>
                        ) : (
                          <p className="text-slate-400 italic text-xs mt-1">
                            Asignación técnica en curso por el equipo de maestranza.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Especificaciones de Parches Custom (TB_DetallesParchesCustom) */}
                    {(patchDetail || srv.tipoServicioId === 1 || srv.descripcionProblema.toLowerCase().includes('parche')) && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs space-y-2 shadow-inner">
                        <div className="flex items-center gap-1.5 text-amber-300 font-bold uppercase tracking-wider">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>Especificación de Parche Custom Acreditado (TB_DetallesParchesCustom)</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                          <div className="bg-night-950/80 p-2.5 rounded-lg border border-night-border">
                            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Texto / Identificación</span>
                            <span className="font-bold text-white text-xs">{patchDetail?.textoPersonalizado || 'OPE-BÚFALO / A+'}</span>
                          </div>
                          <div className="bg-night-950/80 p-2.5 rounded-lg border border-night-border">
                            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Dimensiones</span>
                            <span className="font-bold text-white text-xs">{patchDetail?.dimensiones || '7x5 cm'}</span>
                          </div>
                          <div className="bg-night-950/80 p-2.5 rounded-lg border border-night-border">
                            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Tipo Bordado</span>
                            <span className="font-bold text-amber-300 text-xs">{patchDetail?.tipoBordado || 'Alta Definición con Velcro'}</span>
                          </div>
                          <div className="bg-night-950/80 p-2.5 rounded-lg border border-night-border">
                            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Cantidad Solicitada</span>
                            <span className="font-bold text-white text-xs">{patchDetail?.cantidad || 2} unidades</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bitácora de Seguimiento Plegable (Misma estructura y lógica que Administrador) */}
                    {seguimientos.length > 0 && (
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
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal para Registrar Nueva Solicitud de Servicio Técnico */}
      <Modal
        isOpen={modalNuevoServicio}
        onClose={() => setModalNuevoServicio(false)}
        title="Nueva Solicitud de Mantención / Servicio Técnico"
      >
        <form onSubmit={handleCrearServicio} className="space-y-4">
          <p className="text-xs text-slate-300">
            Seleccione el tipo de servicio técnico oficial de <strong className="text-amber-400">TB_TiposServicio</strong> y
            describa detalladamente el requerimiento de su equipo táctico.
          </p>

          {errorForm && (
            <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorForm}</span>
            </div>
          )}

          {/* Selector de Tipo de Servicio Oficial (TB_TiposServicio) */}
          <div>
            <label htmlFor="tipo-servicio-select" className="block text-xs font-bold uppercase text-slate-200 mb-1.5">
              Tipo de Servicio Oficial (TB_TiposServicio) <span className="text-amber-400">*</span>
            </label>
            <select
              id="tipo-servicio-select"
              value={tipoServicioSeleccionadoId}
              onChange={(e) => {
                const idVal = Number(e.target.value);
                setTipoServicioSeleccionadoId(idVal);
                const match = tiposServicio.find((t) => (t.id_TipoServicio || t.id) === idVal);
                if (match) {
                  setTipoEquipo(match.nombre);
                }
              }}
              className="w-full p-2.5 bg-night-900 border border-night-border rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
            >
              {tiposServicio.length > 0 ? (
                tiposServicio.map((t) => (
                  <option key={t.id_TipoServicio || t.id} value={t.id_TipoServicio || t.id} className="bg-night-900 text-white">
                    {t.nombre} — Base: ${Number(t.costoBase).toLocaleString('es-CL')} CLP (~{t.tiempoEstimadoDias} días)
                  </option>
                ))
              ) : (
                <>
                  <option value={1} className="bg-night-900 text-white">Personalización de Parches — Base: $4.990 CLP</option>
                  <option value={2} className="bg-night-900 text-white">Mantención y Calibración de Armas — Base: $35.000 CLP</option>
                </>
              )}
            </select>
          </div>

          {/* Campos Específicos para Personalización de Parches Custom (TB_DetallesParchesCustom) */}
          {(tipoServicioSeleccionadoId === 1 || tipoEquipo.toLowerCase().includes('parche')) && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Detalles de Parche Custom (TB_DetallesParchesCustom)</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="texto-parche-input" className="block text-[11px] font-bold text-slate-300 mb-1">
                    Texto / Identificación Táctica
                  </label>
                  <input
                    id="texto-parche-input"
                    type="text"
                    value={textoPersonalizado}
                    onChange={(e) => setTextoPersonalizado(e.target.value)}
                    placeholder="Ej. OPE-BÚFALO / O+"
                    className="w-full p-2 bg-night-950 border border-night-border rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label htmlFor="dimensiones-parche-input" className="block text-[11px] font-bold text-slate-300 mb-1">
                    Dimensiones
                  </label>
                  <input
                    id="dimensiones-parche-input"
                    type="text"
                    value={dimensiones}
                    onChange={(e) => setDimensiones(e.target.value)}
                    placeholder="Ej. 7x5 cm o 10x4 cm"
                    className="w-full p-2 bg-night-950 border border-night-border rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label htmlFor="tipo-bordado-input" className="block text-[11px] font-bold text-slate-300 mb-1">
                    Tipo de Bordado / Fijación
                  </label>
                  <input
                    id="tipo-bordado-input"
                    type="text"
                    value={tipoBordado}
                    onChange={(e) => setTipoBordado(e.target.value)}
                    placeholder="Ej. Alta Definición con Velcro"
                    className="w-full p-2 bg-night-950 border border-night-border rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label htmlFor="cantidad-parche-input" className="block text-[11px] font-bold text-slate-300 mb-1">
                    Cantidad
                  </label>
                  <input
                    id="cantidad-parche-input"
                    type="number"
                    min={1}
                    max={100}
                    value={cantidadParches}
                    onChange={(e) => setCantidadParches(Number(e.target.value))}
                    className="w-full p-2 bg-night-950 border border-night-border rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="obs-diseno-input" className="block text-[11px] font-bold text-slate-300 mb-1">
                  Observaciones de Diseño (Colores de Hilo, Camuflaje, etc.)
                </label>
                <input
                  id="obs-diseno-input"
                  type="text"
                  value={observacionesDiseno}
                  onChange={(e) => setObservacionesDiseno(e.target.value)}
                  placeholder="Ej. Fondo negro, letras en hilo gris reflectante."
                  className="w-full p-2 bg-night-950 border border-night-border rounded-lg text-xs text-white"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="descripcion-input" className="block text-xs font-bold uppercase text-slate-200 mb-1.5">
              Descripción del Problema o Falla <span className="text-amber-400">*</span>
            </label>
            <textarea
              id="descripcion-input"
              rows={3}
              value={descripcionProblema}
              onChange={(e) => setDescripcionProblema(e.target.value)}
              placeholder="Ej. Solicitud de confección de parche de alta visibilidad para casco balístico..."
              className="w-full p-3 bg-night-900 border border-night-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setModalNuevoServicio(false)}
              className="min-h-[44px] px-4 py-2 bg-night-800 hover:bg-night-700 text-slate-200 border border-night-border rounded-xl text-sm font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={crearServicioMutation.isPending}
              className="min-h-[44px] px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-sm font-black flex items-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
            >
              <Send className="w-4 h-4" />
              <span>{crearServicioMutation.isPending ? 'Enviando...' : 'Registrar Solicitud'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
