import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ShieldCheck,
  AlertOctagon,
  FileText,
  Plus,
  ChevronLeft,
  ChevronRight,
  Wrench,
  RotateCcw,
  DollarSign,
  PackageCheck,
  ShoppingBag,
  LayoutGrid,
  List,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Layers,
  Image,
  Camera
} from 'lucide-react';
import { productoService } from '../services/productoService';
import { categoriaService } from '../services/categoriaService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { CompraModal } from '../components/common/CompraModal';
import { Modal } from '../components/common/Modal';
import { ProductImage } from '../components/common/ProductImage';
import { ActualizarImagenModal } from '../components/common/ActualizarImagenModal';
import { useAuth } from '../context/AuthContext';
import type { Producto, ApiError } from '../types';

export const CatalogoPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('Administrador');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Estados de vista, filtros y paginación
  const [vista, setVista] = useState<'galeria' | 'lista'>('galeria');
  const [buscar, setBuscar] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number>(0);
  const [precioMin, setPrecioMin] = useState<string>('');
  const [precioMax, setPrecioMax] = useState<string>('');
  const [soloConStock, setSoloConStock] = useState<boolean>(false);
  const [pagina, setPagina] = useState(1);
  const limite = 8;

  // Estado para modal de compra directa (Clientes)
  const [productoAComprar, setProductoAComprar] = useState<Producto | null>(null);
  const [modalCompraAbierto, setModalCompraAbierto] = useState(false);

  // Estado para modal de cambio de imagen de producto
  const [productoAEditarImagen, setProductoAEditarImagen] = useState<Producto | null>(null);

  // Estado para modal de eliminación (Solo Administrador)
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Consulta de categorías con React Query
  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => categoriaService.getCategorias()
  });

  // Consulta de productos con filtros interactivos y paginación
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: [
      'productos',
      {
        buscar,
        idCategoria: categoriaSeleccionada,
        precioMin: precioMin ? Number(precioMin) : undefined,
        precioMax: precioMax ? Number(precioMax) : undefined,
        soloConStock,
        pagina,
        limite
      }
    ],
    queryFn: () =>
      productoService.getProductos({
        buscar: buscar.trim() || undefined,
        idCategoria: categoriaSeleccionada > 0 ? categoriaSeleccionada : undefined,
        precioMin: precioMin !== '' && !isNaN(Number(precioMin)) ? Number(precioMin) : undefined,
        precioMax: precioMax !== '' && !isNaN(Number(precioMax)) ? Number(precioMax) : undefined,
        soloConStock: soloConStock || undefined,
        pagina,
        limite
      }),
    placeholderData: (prev) => prev
  });

  // Mutación para dar de baja un producto (Exclusivo Administrador)
  const deleteMutation = useMutation({
    mutationFn: (id: number) => productoService.eliminarProducto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics-productos'] });
      setProductoAEliminar(null);
      setDeleteError(null);
    },
    onError: (err: ApiError) => {
      setDeleteError(err.message || 'Error al intentar eliminar el producto.');
    }
  });

  const productos = data?.items || [];
  const totalPaginas = data?.totalPaginas || 1;
  const totalRegistros = data?.total || 0;

  const tieneFiltrosActivos =
    buscar.trim() !== '' ||
    categoriaSeleccionada > 0 ||
    precioMin !== '' ||
    precioMax !== '' ||
    soloConStock;

  const handleResetFilters = () => {
    setBuscar('');
    setCategoriaSeleccionada(0);
    setPrecioMin('');
    setPrecioMax('');
    setSoloConStock(false);
    setPagina(1);
  };

  const confirmarEliminacion = () => {
    if (productoAEliminar) {
      deleteMutation.mutate(productoAEliminar.id_Producto);
    }
  };

  return (
    <div className="space-y-8">
      {/* Encabezado Principal y Controles de Vista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-night-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Catálogo de Equipamiento Táctico e Inventario</span>
            </h1>
          </div>
          <p className="text-sm text-slate-300">
            {isAdmin
              ? 'Gestión unificada de catálogo comercial e inventario operativo con permisos de edición y baja'
              : 'Indumentaria de protección balística, accesorios operativos y suministros tácticos certificados'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Conmutador Visual: Galería vs. Lista */}
          <div className="flex items-center bg-night-850 p-1 rounded-xl border border-night-border shadow-sm">
            <button
              type="button"
              onClick={() => setVista('galeria')}
              aria-label="Vista de cuadrícula de 4 columnas"
              title="Vista Galería"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                vista === 'galeria'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Galería</span>
            </button>
            <button
              type="button"
              onClick={() => setVista('lista')}
              aria-label="Vista de lista y tabla detallada"
              title="Vista Lista"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                vista === 'lista'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Lista</span>
            </button>
          </div>

          {hasRole('Cliente') && (
            <Link
              to="/cliente?tab=servicios"
              className="min-h-[44px] px-4 py-2 bg-night-850 hover:bg-night-800 text-cyan-300 border border-cyan-500/40 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shrink-0 shadow-sm focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              <Wrench className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              <span>Solicitar Servicio Técnico</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin/productos/nuevo"
              className="min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0 focus-visible:outline-2 focus-visible:outline-white"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              <span>Nuevo Producto</span>
            </Link>
          )}
        </div>
      </div>

      {/* Panel de Filtros Interactivos: Búsqueda, Categoría, Precio y Stock */}
      <section aria-labelledby="filtros-heading" className="bg-night-850/95 border border-night-border p-5 rounded-2xl space-y-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-night-border pb-3">
          <h2 id="filtros-heading" className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Filter className="w-4 h-4" aria-hidden="true" />
            <span>Filtros de Búsqueda y Rango de Precios</span>
          </h2>
          {tieneFiltrosActivos && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-slate-300 hover:text-amber-300 flex items-center gap-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 rounded-lg px-2.5 py-1 bg-night-900 border border-night-border"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Limpiar Filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          {/* Buscador de Texto */}
          <div className="sm:col-span-6 lg:col-span-5">
            <label htmlFor="search-input" className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
              Buscar por nombre o descripción
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/70">
                <Search className="w-4 h-4" aria-hidden="true" />
              </div>
              <input
                id="search-input"
                type="search"
                value={buscar}
                onChange={(e) => {
                  setBuscar(e.target.value);
                  setPagina(1);
                }}
                placeholder="Ej. Mochila, Botas, Chaqueta..."
                className="w-full pl-10 pr-4 py-2 bg-night-900 border border-night-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-colors"
              />
            </div>
          </div>

          {/* Filtro por Categoría */}
          <div className="sm:col-span-6 lg:col-span-4">
            <label htmlFor="categoria-select" className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
              Categoría
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/70">
                <Filter className="w-4 h-4" aria-hidden="true" />
              </div>
              <select
                id="categoria-select"
                value={categoriaSeleccionada}
                onChange={(e) => {
                  setCategoriaSeleccionada(Number(e.target.value));
                  setPagina(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-night-900 border border-night-border rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-colors"
              >
                <option value={0} className="bg-night-900 text-white">Todas las categorías</option>
                {categorias.map((c) => (
                  <option key={c.id_Categoria} value={c.id_Categoria} className="bg-night-900 text-white">
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtro de Stock Disponible */}
          <div className="sm:col-span-12 lg:col-span-3 flex sm:items-end">
            <label
              htmlFor="stock-checkbox"
              className="w-full flex items-center gap-2.5 px-3 py-2 bg-night-900 border border-night-border rounded-xl cursor-pointer hover:border-amber-500/50 transition-colors"
            >
              <input
                id="stock-checkbox"
                type="checkbox"
                checked={soloConStock}
                onChange={(e) => {
                  setSoloConStock(e.target.checked);
                  setPagina(1);
                }}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-night-800 border-night-border"
              />
              <PackageCheck className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span className="text-xs font-bold text-slate-200 select-none">Solo con stock</span>
            </label>
          </div>
        </div>

        {/* Rango de Precios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-night-border">
          <div>
            <label htmlFor="precio-min" className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
              Precio Mínimo (CLP)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-400/70">
                <DollarSign className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <input
                id="precio-min"
                type="number"
                min="0"
                step="1000"
                value={precioMin}
                onChange={(e) => {
                  setPrecioMin(e.target.value);
                  setPagina(1);
                }}
                placeholder="Ej. 10000"
                className="w-full pl-8 pr-3 py-1.5 bg-night-900 border border-night-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="precio-max" className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
              Precio Máximo (CLP)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-400/70">
                <DollarSign className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <input
                id="precio-max"
                type="number"
                min="0"
                step="1000"
                value={precioMax}
                onChange={(e) => {
                  setPrecioMax(e.target.value);
                  setPagina(1);
                }}
                placeholder="Ej. 90000"
                className="w-full pl-8 pr-3 py-1.5 bg-night-900 border border-night-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-colors"
              />
            </div>
          </div>

          {/* Resumen de Filtros Activos */}
          <div className="sm:col-span-2 flex items-center gap-2 flex-wrap pt-2 sm:pt-6">
            {categoriaSeleccionada > 0 && (
              <span className="text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                Cat: {categorias.find((c) => c.id_Categoria === categoriaSeleccionada)?.nombre}
              </span>
            )}
            {precioMin && (
              <span className="text-[11px] font-semibold bg-night-900 text-slate-200 border border-night-border px-2.5 py-0.5 rounded-full">
                Min: ${Number(precioMin).toLocaleString('es-CL')}
              </span>
            )}
            {precioMax && (
              <span className="text-[11px] font-semibold bg-night-900 text-slate-200 border border-night-border px-2.5 py-0.5 rounded-full">
                Max: ${Number(precioMax).toLocaleString('es-CL')}
              </span>
            )}
            {soloConStock && (
              <span className="text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full shadow-sm">
                En stock
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Región de Anuncio en Vivo para Lectores de Pantalla (WCAG 2.2 AA) */}
      <div aria-live="polite" className="sr-only">
        {isLoading
          ? 'Cargando listado de productos'
          : `Se encontraron ${totalRegistros} productos en total. Página ${pagina} de ${totalPaginas}.`}
      </div>

      {/* Estado 1: CARGA */}
      {isLoading && (
        <div className="py-12">
          <LoadingSpinner text="Consultando inventario de productos tácticos..." size="lg" />
        </div>
      )}

      {/* Estado 2: ERROR */}
      {isError && (
        <ErrorAlert
          title="Fallo al obtener productos"
          message={(error as any)?.message || 'No se pudo conectar con la API de productos.'}
          onRetry={refetch}
        />
      )}

      {/* Estado 3: VACÍO */}
      {!isLoading && !isError && productos.length === 0 && (
        <EmptyState
          title="No se encontraron productos con los filtros seleccionados"
          description="Intente modificar los términos de búsqueda, ajuste los rangos de precio o seleccione otra categoría del catálogo."
          actionText="Limpiar todos los filtros"
          onAction={handleResetFilters}
        />
      )}

      {/* LISTADO DE PRODUCTOS: VISTA GALERÍA (4 COLUMNAS) VS. VISTA LISTA (TABLA) */}
      {!isLoading && !isError && productos.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-300 px-1">
            <span>Mostrando <strong className="text-white">{productos.length}</strong> de <strong className="text-white">{totalRegistros}</strong> productos ({vista === 'galeria' ? 'Vista Galería 4x' : 'Vista Tabla Detallada'})</span>
            <span>Página <strong className="text-amber-400">{pagina}</strong> de <strong className="text-amber-400">{totalPaginas}</strong></span>
          </div>

          {/* VISTA 1: GALERÍA DE 4 PRODUCTOS HORIZONTALES POR FILA */}
          {vista === 'galeria' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {productos.map((prod) => (
                <article
                  key={prod.id_Producto}
                  onClick={() => navigate(`/productos/${prod.id_Producto}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/productos/${prod.id_Producto}`);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Ver ficha técnica y detalles de ${prod.nombre}`}
                  className="bg-night-850/95 border border-night-border hover:border-amber-400/80 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.2)] hover:-translate-y-1 transition-all duration-200 cursor-pointer group focus-visible:outline-2 focus-visible:outline-amber-400"
                >
                  {/* Imagen Táctica con Badges y Control de Administrador */}
                  <div className="relative">
                    <ProductImage
                      src={prod.imagenUrl}
                      alt={prod.nombre}
                      containerClassName="w-full h-44 bg-night-900 border-b border-night-border overflow-hidden"
                      className="w-full h-full object-cover"
                    />

                    {/* Badges de Categoría y Restricción sobre la imagen */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-night-950/85 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full shadow-md backdrop-blur-xs truncate max-w-[130px]">
                        {prod.categoria?.nombre || 'General'}
                      </span>

                      {prod.restriccionEdad > 0 && (
                        <span className="text-[10px] font-bold bg-rose-950/85 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-md backdrop-blur-xs">
                          <AlertOctagon className="w-3 h-3 text-rose-400" aria-hidden="true" />
                          <span>+{prod.restriccionEdad} años</span>
                        </span>
                      )}
                    </div>

                    {/* Botón rápido para Administrador para Cambiar Imagen */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductoAEditarImagen(prod);
                        }}
                        aria-label={`Cambiar imagen de ${prod.nombre}`}
                        title="Gestionar imagen táctica"
                        className="absolute bottom-2.5 right-2.5 bg-night-950/90 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/40 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-lg transition-colors z-10"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Imagen</span>
                      </button>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Nombre y Descripción */}
                    <div>
                      <h2 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                        {prod.nombre}
                      </h2>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {prod.descripcion || 'Sin descripción técnica disponible.'}
                      </p>
                    </div>

                    {/* Indicadores Tácticos / Permisos */}
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {prod.soloPersonalAutorizado && (
                        <span className="bg-night-900 text-slate-200 border border-night-border px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
                          <ShieldCheck className="w-3 h-3 text-amber-400" aria-hidden="true" />
                          <span>Autorizado</span>
                        </span>
                      )}
                      {prod.requierePermiso && (
                        <span className="bg-night-900 text-slate-200 border border-night-border px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
                          <FileText className="w-3 h-3 text-cyan-400" aria-hidden="true" />
                          <span>Permiso</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pie de Tarjeta: Precio, Stock y Acciones */}
                  <div className="p-4 pt-0 mt-auto border-t border-night-border bg-night-900/60">
                    <div className="flex items-baseline justify-between py-2.5">
                      <div>
                        <span className="text-[11px] text-slate-400 block font-semibold">Precio</span>
                        <span className="text-lg font-black text-amber-400">
                          ${Number(prod.precio).toLocaleString('es-CL')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block font-semibold">Stock</span>
                        <span className={`text-xs font-bold ${prod.stock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {prod.stock > 0 ? `${prod.stock} un.` : 'Agotado'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductoAComprar(prod);
                          setModalCompraAbierto(true);
                        }}
                        disabled={prod.stock <= 0}
                        className="w-full min-h-[38px] px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{prod.stock > 0 ? 'Comprar' : 'Agotado'}</span>
                      </button>

                      {/* Botones de Edición y Eliminación CRUD: Visibles ÚNICAMENTE para Administrador */}
                      {isAdmin && (
                        <div className="flex items-center gap-2 pt-1 border-t border-night-border/60">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/productos/editar/${prod.id_Producto}`);
                            }}
                            aria-label={`Editar producto ${prod.nombre}`}
                            className="flex-1 min-h-[34px] px-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                          >
                            <Edit className="w-3 h-3 text-amber-400" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProductoAEditarImagen(prod);
                            }}
                            aria-label={`Cambiar imagen de ${prod.nombre}`}
                            title="Cambiar imagen"
                            className="min-h-[34px] px-2 bg-night-900 hover:bg-night-800 text-amber-300 border border-night-border rounded-lg text-[11px] font-bold flex items-center justify-center transition-colors"
                          >
                            <Image className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProductoAEliminar(prod);
                            }}
                            aria-label={`Eliminar producto ${prod.nombre}`}
                            className="min-h-[34px] px-2.5 bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-800/50 rounded-lg text-[11px] font-bold flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* VISTA 2: LISTA / TABLA DETALLADA CON PERMISOS CRUD */}
          {vista === 'lista' && (
            <div className="overflow-x-auto bg-night-850/95 border border-night-border rounded-2xl shadow-xl">
              <table className="w-full text-left text-sm text-slate-200">
                <thead className="bg-night-900/90 text-xs font-bold text-amber-300 uppercase tracking-wider border-b border-night-border">
                  <tr>
                    <th scope="col" className="px-6 py-4">ID</th>
                    <th scope="col" className="px-6 py-4">Producto</th>
                    <th scope="col" className="px-6 py-4">Categoría</th>
                    <th scope="col" className="px-6 py-4 text-right">Precio</th>
                    <th scope="col" className="px-6 py-4 text-center">Stock</th>
                    <th scope="col" className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-night-border">
                  {productos.map((prod) => (
                    <tr key={prod.id_Producto} className="hover:bg-night-800/60 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400 font-semibold">
                        #{prod.id_Producto}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-night-border bg-night-900 shadow-inner">
                            <ProductImage
                              src={prod.imagenUrl}
                              alt={prod.nombre}
                              containerClassName="w-full h-full"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{prod.nombre}</div>
                            {prod.numeroSerie && (
                              <div className="text-xs font-mono text-slate-400">SN: {prod.numeroSerie}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-night-900 text-slate-200 px-2.5 py-1 rounded-lg border border-night-border">
                          <Layers className="w-3 h-3 text-amber-400" aria-hidden="true" />
                          <span>{prod.categoria?.nombre || 'General'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-amber-400">
                        ${Number(prod.precio).toLocaleString('es-CL')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          prod.stock > 0 ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/15 text-rose-300 border border-rose-500/40'
                        }`}>
                          {prod.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Ver Ficha Técnica para todos */}
                          <Link
                            to={`/productos/${prod.id_Producto}`}
                            aria-label={`Ver ${prod.nombre}`}
                            title="Ver Ficha Técnica"
                            className="min-h-[38px] min-w-[38px] p-2 text-slate-300 hover:text-white hover:bg-night-800 rounded-lg transition-colors flex items-center justify-center border border-transparent hover:border-night-border focus-visible:outline-2 focus-visible:outline-amber-400"
                          >
                            <Eye className="w-4 h-4 text-amber-400" aria-hidden="true" />
                          </Link>

                          {/* Botón Comprar Rápido */}
                          <button
                            type="button"
                            onClick={() => {
                              setProductoAComprar(prod);
                              setModalCompraAbierto(true);
                            }}
                            disabled={prod.stock <= 0}
                            title="Realizar Pedido"
                            className="min-h-[38px] px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Comprar</span>
                          </button>

                          {/* Opciones CRUD: Visibles ÚNICAMENTE para Administrador */}
                          {isAdmin && (
                            <>
                              <Link
                                to={`/admin/productos/editar/${prod.id_Producto}`}
                                aria-label={`Editar ${prod.nombre}`}
                                title="Editar Producto"
                                className="min-h-[38px] min-w-[38px] p-2 text-amber-400 hover:text-amber-300 hover:bg-night-800 rounded-lg transition-colors flex items-center justify-center border border-transparent hover:border-night-border focus-visible:outline-2 focus-visible:outline-amber-400"
                              >
                                <Edit className="w-4 h-4" aria-hidden="true" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => setProductoAEditarImagen(prod)}
                                aria-label={`Cambiar imagen de ${prod.nombre}`}
                                title="Cambiar Imagen"
                                className="min-h-[38px] min-w-[38px] p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 rounded-lg transition-colors flex items-center justify-center border border-transparent hover:border-night-border focus-visible:outline-2 focus-visible:outline-cyan-400"
                              >
                                <Image className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setProductoAEliminar(prod)}
                                aria-label={`Eliminar ${prod.nombre}`}
                                title="Eliminar Producto"
                                className="min-h-[38px] min-w-[38px] p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors flex items-center justify-center focus-visible:outline-2 focus-visible:outline-rose-400"
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación Accesible (WCAG 2.2 AA) */}
          {totalPaginas > 1 && (
            <nav aria-label="Paginación de resultados" className="flex items-center justify-center gap-2 pt-6">
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(p - 1, 1))}
                disabled={pagina <= 1}
                aria-label="Página anterior"
                className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-night-850 border border-night-border text-slate-200 hover:text-amber-300 hover:bg-night-800 hover:border-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>

              <span className="px-4 text-sm font-semibold text-slate-200">
                Página <strong className="text-amber-400 font-bold">{pagina}</strong> de{' '}
                <strong className="text-amber-400 font-bold">{totalPaginas}</strong>
              </span>

              <button
                type="button"
                onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))}
                disabled={pagina >= totalPaginas}
                aria-label="Página siguiente"
                className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-night-850 border border-night-border text-slate-200 hover:text-amber-300 hover:bg-night-800 hover:border-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </nav>
          )}
        </div>
      )}

      {/* Modal de Compra Rápida para Clientes */}
      <CompraModal
        producto={productoAComprar}
        isOpen={modalCompraAbierto}
        onClose={() => {
          setModalCompraAbierto(false);
          setProductoAComprar(null);
        }}
      />

      {/* Modal Accesible de Confirmación de Eliminación (Solo Administrador) */}
      <Modal
        isOpen={!!productoAEliminar}
        onClose={() => {
          setProductoAEliminar(null);
          setDeleteError(null);
        }}
        title="Confirmar Baja de Producto"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-rose-950/50 border border-rose-800/70 rounded-xl text-rose-200 shadow-inner">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-bold text-white">¿Está seguro de eliminar este artículo del catálogo e inventario?</p>
              <p className="mt-1 text-slate-200">
                Se dará de baja el producto:{' '}
                <strong className="text-amber-300">{productoAEliminar?.nombre}</strong> (ID #{productoAEliminar?.id_Producto}).
              </p>
            </div>
          </div>

          {deleteError && (
            <div role="alert" className="p-3 bg-rose-950 border border-rose-800 rounded-xl text-xs text-rose-200">
              {deleteError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-night-border">
            <button
              type="button"
              onClick={() => {
                setProductoAEliminar(null);
                setDeleteError(null);
              }}
              className="min-h-[44px] px-4 py-2 bg-night-800 hover:bg-night-700 text-slate-200 border border-night-border rounded-xl text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmarEliminacion}
              disabled={deleteMutation.isPending}
              className="min-h-[44px] px-5 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-xl text-sm font-black transition-colors flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 shadow-md"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Sí, Eliminar Producto'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Gestión e Inserción de Imagen Táctica (Exclusivo Administrador) */}
      <ActualizarImagenModal
        isOpen={!!productoAEditarImagen}
        onClose={() => setProductoAEditarImagen(null)}
        producto={productoAEditarImagen}
      />
    </div>
  );
};
