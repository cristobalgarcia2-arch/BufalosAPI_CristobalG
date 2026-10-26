import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Layers,
  ChevronLeft,
  ChevronRight,
  Camera
} from 'lucide-react';
import { productoService } from '../../services/productoService';
import { categoriaService } from '../../services/categoriaService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { ProductImage } from '../../components/common/ProductImage';
import { ActualizarImagenModal } from '../../components/common/ActualizarImagenModal';
import { useAuth } from '../../context/AuthContext';
import type { Producto, ApiError } from '../../types';

export const AdminProductosPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('Administrador');
  const queryClient = useQueryClient();
  const [buscar, setBuscar] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number>(0);
  const [pagina, setPagina] = useState(1);
  const limite = 8;

  // Estado para el modal de eliminación y de imagen
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);
  const [productoAEditarImagen, setProductoAEditarImagen] = useState<Producto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Consulta de categorías
  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => categoriaService.getCategorias()
  });

  // Consulta de productos
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['productos-admin', { buscar, idCategoria: categoriaSeleccionada, pagina, limite }],
    queryFn: () =>
      productoService.getProductos({
        buscar: buscar.trim() || undefined,
        idCategoria: categoriaSeleccionada > 0 ? categoriaSeleccionada : undefined,
        pagina,
        limite
      })
  });

  // Mutación para eliminar producto con invalidación de caché
  const deleteMutation = useMutation({
    mutationFn: (id: number) => productoService.eliminarProducto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['productos-admin'] });
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

  const confirmarEliminacion = () => {
    if (productoAEliminar) {
      deleteMutation.mutate(productoAEliminar.id_Producto);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acción Crear */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-night-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Gestión de Inventario Táctico
            </h1>
            {!isAdmin && (
              <span className="text-xs font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded-full shadow-sm">
                Vista Operativa Técnico
              </span>
            )}
          </div>
          <p className="text-sm text-slate-300">
            {isAdmin
              ? 'Panel administrativo para crear, modificar y dar de baja productos del catálogo'
              : 'Consulta de inventario y disponibilidad operativa para personal técnico'}
          </p>
        </div>

        {isAdmin && (
          <Link
            to="/admin/productos/nuevo"
            className="min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:bg-amber-600 text-slate-950 font-black rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0 focus-visible:outline-2 focus-visible:outline-white"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            <span>Agregar Producto</span>
          </Link>
        )}
      </div>

      {/* Filtros y Búsqueda */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-night-850/95 border border-night-border p-4 rounded-2xl shadow-lg">
        <div className="sm:col-span-8">
          <label htmlFor="admin-search" className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
            Buscar en Inventario
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/70">
              <Search className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              id="admin-search"
              type="search"
              value={buscar}
              onChange={(e) => {
                setBuscar(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por código, serie o nombre..."
              className="w-full pl-10 pr-4 py-2 bg-night-900 border border-night-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <div className="sm:col-span-4">
          <label htmlFor="admin-categoria" className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
            Filtrar por Categoría
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/70">
              <Filter className="w-4 h-4" aria-hidden="true" />
            </div>
            <select
              id="admin-categoria"
              value={categoriaSeleccionada}
              onChange={(e) => {
                setCategoriaSeleccionada(Number(e.target.value));
                setPagina(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-night-900 border border-night-border rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
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
      </div>

      {/* Estados de UI */}
      {isLoading && <LoadingSpinner text="Cargando catálogo administrativo..." size="lg" />}

      {isError && (
        <ErrorAlert
          title="Error al cargar inventario"
          message={(error as any)?.message || 'No fue posible consultar la base de datos.'}
          onRetry={refetch}
        />
      )}

      {!isLoading && !isError && productos.length === 0 && (
        <EmptyState
          title="Sin resultados en inventario"
          description="No se encontraron registros coincidentes con los criterios actuales."
          actionText="Limpiar búsqueda"
          onAction={() => {
            setBuscar('');
            setCategoriaSeleccionada(0);
            setPagina(1);
          }}
        />
      )}

      {/* Listado con Adaptación Responsive: Tarjetas en móvil, Tabla en Desktop */}
      {!isLoading && !isError && productos.length > 0 && (
        <div className="space-y-4">
          {/* Vista Móvil (< 768px): Tarjetas accesibles */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {productos.map((prod) => (
              <div
                key={prod.id_Producto}
                className="bg-night-850/95 border border-night-border rounded-2xl p-4 space-y-3 shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-night-border bg-night-900 shadow-inner">
                    <ProductImage
                      src={prod.imagenUrl}
                      alt={prod.nombre}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                        {prod.categoria?.nombre || 'General'}
                      </span>
                      <span className="font-mono text-sm font-black text-amber-400 shrink-0">
                        ${Number(prod.precio).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-base mt-1 truncate">{prod.nombre}</h3>
                  </div>
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <p>Stock: <span className="font-bold text-white">{prod.stock} unidades</span></p>
                  {prod.numeroSerie && <p>N° Serie: <span className="font-mono text-amber-300/90">{prod.numeroSerie}</span></p>}
                </div>

                {/* Botones de acción táctiles (mínimo 44px) */}
                <div className="flex items-center gap-2 pt-2 border-t border-night-border">
                  <Link
                    to={`/productos/${prod.id_Producto}`}
                    aria-label={`Ver detalle de ${prod.nombre}`}
                    className="flex-1 min-h-[44px] px-3 bg-night-800 hover:bg-night-700 text-slate-200 border border-night-border rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-amber-400"
                  >
                    <Eye className="w-4 h-4 text-amber-400" aria-hidden="true" />
                    <span>Ver Ficha</span>
                  </Link>
                  {isAdmin && (
                    <>
                      <Link
                        to={`/admin/productos/editar/${prod.id_Producto}`}
                        aria-label={`Editar producto ${prod.nombre}`}
                        className="flex-1 min-h-[44px] px-3 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-amber-400"
                      >
                        <Edit className="w-4 h-4" aria-hidden="true" />
                        <span>Editar</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => setProductoAEditarImagen(prod)}
                        aria-label={`Cambiar imagen de ${prod.nombre}`}
                        title="Cambiar imagen"
                        className="min-h-[44px] px-3 bg-night-800 hover:bg-night-700 text-amber-300 border border-night-border rounded-xl text-xs font-bold flex items-center justify-center transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductoAEliminar(prod)}
                        aria-label={`Eliminar producto ${prod.nombre}`}
                        className="min-h-[44px] min-w-[44px] px-3 bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-bold flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-rose-400"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Vista Escritorio (>= 768px): Tabla Semántica con Contraste Morado/Dorado */}
          <div className="hidden md:block overflow-x-auto bg-night-850/95 border border-night-border rounded-2xl shadow-xl">
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
                        <Link
                          to={`/productos/${prod.id_Producto}`}
                          aria-label={`Ver ${prod.nombre}`}
                          title="Ver Ficha Técnica"
                          className="min-h-[40px] min-w-[40px] p-2 text-slate-300 hover:text-white hover:bg-night-800 rounded-lg transition-colors flex items-center justify-center border border-transparent hover:border-night-border focus-visible:outline-2 focus-visible:outline-amber-400"
                        >
                          <Eye className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        </Link>
                        {isAdmin && (
                          <>
                            <Link
                              to={`/admin/productos/editar/${prod.id_Producto}`}
                              aria-label={`Editar ${prod.nombre}`}
                              title="Editar Producto"
                              className="min-h-[40px] min-w-[40px] p-2 text-amber-400 hover:text-amber-300 hover:bg-night-800 rounded-lg transition-colors flex items-center justify-center border border-transparent hover:border-night-border focus-visible:outline-2 focus-visible:outline-amber-400"
                            >
                              <Edit className="w-4 h-4" aria-hidden="true" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setProductoAEditarImagen(prod)}
                              aria-label={`Cambiar imagen de ${prod.nombre}`}
                              title="Cambiar Imagen"
                              className="min-h-[40px] min-w-[40px] p-2 text-cyan-400 hover:text-cyan-300 hover:bg-night-800 rounded-lg transition-colors flex items-center justify-center border border-transparent hover:border-night-border focus-visible:outline-2 focus-visible:outline-cyan-400"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductoAEliminar(prod)}
                              aria-label={`Eliminar ${prod.nombre}`}
                              title="Eliminar Producto"
                              className="min-h-[40px] min-w-[40px] p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors flex items-center justify-center focus-visible:outline-2 focus-visible:outline-rose-400"
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

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-slate-300">
                Total: <strong className="text-white">{totalRegistros}</strong> productos registrados
              </span>

              <nav aria-label="Navegación de páginas admin" className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.max(p - 1, 1))}
                  disabled={pagina <= 1}
                  aria-label="Página anterior"
                  className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-night-850 border border-night-border text-slate-200 hover:text-amber-300 hover:bg-night-800 hover:border-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all focus-visible:outline-2 focus-visible:outline-amber-400"
                >
                  <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                </button>

                <span className="px-3 text-xs font-bold text-slate-200">
                  <strong className="text-amber-400">{pagina}</strong> / <strong className="text-amber-400">{totalPaginas}</strong>
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
            </div>
          )}
        </div>
      )}

      {/* Modal Accesible de Confirmación de Eliminación */}
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
              <p className="font-bold text-white">¿Está seguro de eliminar este artículo del catálogo?</p>
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

      {/* Modal para Administrador: Cargar y Modificar Imagen */}
      <ActualizarImagenModal
        isOpen={!!productoAEditarImagen}
        onClose={() => setProductoAEditarImagen(null)}
        producto={productoAEditarImagen}
      />
    </div>
  );
};
