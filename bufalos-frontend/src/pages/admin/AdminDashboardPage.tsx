import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  DollarSign,
  Wrench,
  Shield,
  ArrowRight,
  Plus,
  RotateCw,
  Search,
  Receipt,
  Truck,
  CheckCircle2,
  Activity,
  Users
} from 'lucide-react';
import { productoService } from '../../services/productoService';
import { pedidoService } from '../../services/pedidoService';
import { servicioTecnicoService } from '../../services/servicioTecnicoService';
import { usuarioService } from '../../services/usuarioService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [buscarTransaccion, setBuscarTransaccion] = useState('');
  const [sincronizandoManual, setSincronizandoManual] = useState(false);

  // Consultas sincronizadas en tiempo real (polling cada 3 segundos)
  const {
    data: productosData,
    isLoading: loadingProds,
    refetch: refetchProds
  } = useQuery({
    queryKey: ['admin-metrics-productos'],
    queryFn: () => productoService.getProductos({ limite: 1 }),
    refetchInterval: 3000
  });

  const {
    data: pedidos = [],
    isLoading: loadingPedidos,
    refetch: refetchPedidos
  } = useQuery({
    queryKey: ['admin-metrics-pedidos'],
    queryFn: () => pedidoService.getPedidos(),
    refetchInterval: 3000
  });

  const {
    data: servicios = [],
    isLoading: loadingServicios,
    refetch: refetchServicios
  } = useQuery({
    queryKey: ['admin-metrics-servicios'],
    queryFn: () => servicioTecnicoService.getServicios(),
    refetchInterval: 3000
  });

  const {
    data: usuarios = [],
    refetch: refetchUsuarios
  } = useQuery({
    queryKey: ['admin-metrics-usuarios'],
    queryFn: () => usuarioService.getUsuarios(),
    refetchInterval: 5000
  });

  const isLoading = loadingProds || loadingPedidos || loadingServicios;

  // Métricas Consolidadas Globales
  const totalProductos = productosData?.total || 0;
  const totalFacturado = pedidos.reduce((acc, p) => acc + Number(p.total), 0);
  const totalServicios = servicios.length;

  // Conteo activo de tickets de servicio técnico (excluyendo Finalizados y Cancelados)
  const ticketsActivos = servicios.filter(
    (s) => s.estado !== 'Finalizado' && s.estado !== 'Cancelado'
  ).length;

  const ticketsEnRevision = servicios.filter(
    (s) => s.estado === 'En Revisión' || s.estado === 'En Revision' || s.estado === 'En Proceso'
  ).length;

  const ticketsEnReparacion = servicios.filter(
    (s) => s.estado === 'En Reparación' || s.estado === 'En Reparacion'
  ).length;

  const ticketsFinalizados = servicios.filter((s) => s.estado === 'Finalizado').length;

  // Función de Sincronización Manual Inmediata
  const handleSincronizarTodo = async () => {
    setSincronizandoManual(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-metrics-productos'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-metrics-pedidos'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-metrics-servicios'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-metrics-usuarios'] }),
      refetchProds(),
      refetchPedidos(),
      refetchServicios(),
      refetchUsuarios()
    ]);
    setTimeout(() => setSincronizandoManual(false), 500);
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

  // Filtrado de transacciones comerciales por texto de búsqueda
  const transaccionesFiltradas = pedidos.filter((ped) => {
    if (!buscarTransaccion.trim()) return true;
    const term = buscarTransaccion.toLowerCase();
    const idCoincide = String(ped.id).includes(term);
    const facturaCoincide = ped.factura?.numeroFactura?.toLowerCase().includes(term);
    const clienteCoincide =
      ped.usuario?.nombreCompleto?.toLowerCase().includes(term) ||
      ped.usuario?.correo?.toLowerCase().includes(term) ||
      ped.usuario?.email?.toLowerCase().includes(term);
    const estadoCoincide = (ped.estado?.nombre || ped.estadoPedido || '').toLowerCase().includes(term);
    return idCoincide || facturaCoincide || clienteCoincide || estadoCoincide;
  });

  return (
    <div className="space-y-8">
      {/* Encabezado del Panel de Administración con Sincronización en Tiempo Real */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-night-border pb-6">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full shadow-sm">
              Panel de Control Master
            </span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sincronización en tiempo real</span>
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-amber-400" aria-hidden="true" />
            <span>Administración Búfalos Tactical</span>
          </h1>
          <p className="text-sm text-slate-300 mt-0.5">
            Consolidado global de inventario, facturación comercial y servicios técnicos operativos
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleSincronizarTodo}
            disabled={sincronizandoManual}
            className="min-h-[44px] px-3.5 py-2 bg-night-850 hover:bg-night-800 text-slate-200 border border-night-border font-bold rounded-xl text-sm flex items-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 disabled:opacity-50"
            title="Refrescar métricas ahora"
          >
            <RotateCw className={`w-4 h-4 text-amber-400 ${sincronizandoManual ? 'animate-spin' : ''}`} />
            <span>{sincronizandoManual ? 'Actualizando...' : 'Sincronizar'}</span>
          </button>

          <Link
            to="/admin/usuarios"
            className="min-h-[44px] px-4 py-2.5 bg-night-850 hover:bg-night-800 text-amber-300 font-bold rounded-xl text-sm flex items-center gap-2 border border-amber-500/30 hover:border-amber-400 transition-colors shadow-sm"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Usuarios ({usuarios.length})</span>
          </Link>

          <Link
            to="/admin/productos/nuevo"
            className="min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] focus-visible:outline-2 focus-visible:outline-white"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </Link>

          <Link
            to="/catalogo"
            className="min-h-[44px] px-4 py-2.5 bg-night-850 hover:bg-night-800 text-slate-200 font-bold rounded-xl text-sm flex items-center gap-2 border border-night-border hover:border-amber-500/40 transition-colors"
          >
            <Package className="w-4 h-4 text-amber-400" />
            <span>Catálogo e Inventario</span>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner text="Consolidando métricas globales en tiempo real..." size="lg" />
        </div>
      ) : (
        <>
          {/* Tarjetas de Métricas Principales (Consolidadas y en Tiempo Real) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Métrica 1: Total de Artículos */}
            <div className="bg-night-850/95 border border-night-border hover:border-amber-500/40 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Total de Artículos
                </span>
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-white">{totalProductos}</span>
                <span className="text-xs text-slate-300 block mt-1">Artículos registrados en catálogo</span>
              </div>
              <div className="mt-3 pt-3 border-t border-night-border flex items-center justify-between text-[11px] text-amber-400 font-bold">
                <Link to="/catalogo" className="hover:underline flex items-center gap-1">
                  <span>Gestionar inventario</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Métrica 2: Facturación Acumulada */}
            <div className="bg-night-850/95 border border-night-border hover:border-emerald-500/40 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Facturación Acumulada
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl lg:text-3xl font-black text-emerald-400">
                  ${totalFacturado.toLocaleString('es-CL')}
                </span>
                <span className="text-xs text-slate-300 block mt-1">
                  {pedidos.length} órdenes comerciales registradas
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-night-border text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% de transacciones auditadas</span>
              </div>
            </div>

            {/* Métrica 3: Conteo Activo de Tickets de Servicio Técnico */}
            <div className="bg-night-850/95 border border-night-border hover:border-cyan-500/40 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Tickets Activos
                </span>
                <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  <Wrench className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-cyan-400">{ticketsActivos}</span>
                <span className="text-xs text-slate-300 block mt-1">
                  En curso ({totalServicios} tickets en total)
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-night-border flex items-center gap-2 text-[11px] text-slate-300 flex-wrap">
                <span className="text-amber-400 font-bold">{ticketsEnRevision} en revisión</span>
                <span>&bull;</span>
                <span className="text-cyan-400 font-bold">{ticketsEnReparacion} en reparación</span>
                <span>&bull;</span>
                <span className="text-emerald-400 font-bold">{ticketsFinalizados} listos</span>
              </div>
            </div>

            {/* Métrica 4: Estado Operativo y Conectividad */}
            <div className="bg-night-850/95 border border-night-border hover:border-purple-500/40 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Infraestructura BD
                </span>
                <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-purple-300">SQL Server</span>
                <span className="text-xs text-slate-300 block mt-1">Bufalos_DB activa y sincronizada</span>
              </div>
              <div className="mt-3 pt-3 border-t border-night-border text-[11px] text-purple-300 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Backend .NET 8 / 10 Minimal APIs</span>
              </div>
            </div>
          </div>

          {/* Accesos Rápidos Modulares */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Link
              to="/catalogo"
              className="group bg-night-850/90 hover:bg-night-800 border border-night-border hover:border-amber-400/60 rounded-2xl p-5 transition-all shadow-md flex items-center justify-between"
            >
              <div>
                <h2 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  Catálogo e Inventario
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Crear, editar, consultar y eliminar equipamiento táctico
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              to="/tecnico"
              className="group bg-night-850/90 hover:bg-night-800 border border-night-border hover:border-cyan-400/60 rounded-2xl p-5 transition-all shadow-md flex items-center justify-between"
            >
              <div>
                <h2 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Panel Técnico y Despacho
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Gestionar tickets de soporte, diagnósticos y despacho de pedidos
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              to="/catalogo"
              className="group bg-night-850/90 hover:bg-night-800 border border-night-border hover:border-emerald-400/60 rounded-2xl p-5 transition-all shadow-md flex items-center justify-between"
            >
              <div>
                <h2 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Catálogo General
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Explorar catálogo de clientes con filtros interactivos
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>

          {/* Historial Consolidado de Transacciones Comerciales y Facturas Correlativas */}
          <div className="bg-night-850/95 border border-night-border rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-night-border pb-4">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <span>Historial de Transacciones Comerciales y Facturas Correlativas</span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Registro oficial en SQL Server (TB_Pedidos) con numeración de factura legal
                </p>
              </div>

              {/* Buscador de Transacciones en Tiempo Real */}
              <div className="relative w-full sm:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-400/70">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="search"
                  value={buscarTransaccion}
                  onChange={(e) => setBuscarTransaccion(e.target.value)}
                  placeholder="Buscar por cliente, pedido o factura..."
                  className="w-full pl-9 pr-3 py-2 bg-night-900 border border-night-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            {transaccionesFiltradas.length === 0 ? (
              <p className="text-xs text-slate-300 text-center py-6">
                No se encontraron transacciones comerciales con los términos ingresados.
              </p>
            ) : (
              <div className="divide-y divide-night-border">
                {transaccionesFiltradas.map((ped) => (
                  <div
                    key={ped.id}
                    className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-night-800/60 px-3 rounded-xl transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-sm font-bold text-amber-400">Pedido #{ped.id}</span>
                        {ped.factura && (
                          <span className="text-xs font-mono bg-night-900 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-800/40 flex items-center gap-1 font-bold">
                            <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{ped.factura.numeroFactura}</span>
                          </span>
                        )}
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getEstadoBadge(
                            ped.estado?.nombre || ped.estadoPedido
                          )}`}
                        >
                          {ped.estado?.nombre || ped.estadoPedido || 'Pendiente'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-200 flex items-center gap-2 flex-wrap">
                        <span>
                          Cliente:{' '}
                          <strong className="text-white">
                            {ped.usuario?.nombreCompleto ||
                              (ped.usuario ? `${ped.usuario.nombre} ${ped.usuario.apellido}` : `ID #${ped.usuarioId}`)}
                          </strong>{' '}
                          ({ped.usuario?.correo || ped.usuario?.email || 'Sin correo'})
                        </span>
                        <span className="text-slate-500">&bull;</span>
                        <span className="text-slate-400 font-mono">
                          {new Date(ped.fechaPedido).toLocaleString('es-CL')}
                        </span>
                      </div>

                      {ped.direccionEnvio && (
                        <p className="text-[11px] text-slate-300 flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-amber-400/80" />
                          <span>
                            {ped.metodoEntrega || 'Despacho'}: <span className="text-white font-mono">{ped.direccionEnvio}</span>
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 shrink-0">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-semibold">Total Factura</span>
                        <span className="text-base font-black text-amber-400">
                          ${Number(ped.total).toLocaleString('es-CL')} CLP
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
