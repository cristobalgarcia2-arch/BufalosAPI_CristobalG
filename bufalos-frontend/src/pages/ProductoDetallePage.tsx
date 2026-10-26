import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  AlertOctagon,
  FileText,
  Barcode,
  Layers,
  Edit,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Camera,
  Image,
  Building2,
  Phone,
  Mail
} from 'lucide-react';
import { productoService } from '../services/productoService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { CompraModal } from '../components/common/CompraModal';
import { ProductImage } from '../components/common/ProductImage';
import { ActualizarImagenModal } from '../components/common/ActualizarImagenModal';
import { useAuth } from '../context/AuthContext';

export const ProductoDetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('Administrador');
  const productoId = Number(id);
  const [modalCompraAbierto, setModalCompraAbierto] = useState(false);
  const [modalImagenAbierto, setModalImagenAbierto] = useState(false);

  const {
    data: producto,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['producto', productoId],
    queryFn: () => productoService.getProductoById(productoId),
    enabled: !isNaN(productoId) && productoId > 0
  });

  if (isLoading) {
    return (
      <div className="py-16">
        <LoadingSpinner text="Cargando ficha técnica del producto..." size="lg" />
      </div>
    );
  }

  if (isError || !producto) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <ErrorAlert
          title="Producto no disponible"
          message={(error as any)?.message || 'No fue posible cargar el detalle del producto solicitado.'}
          onRetry={refetch}
        />
        <div className="mt-4">
          <button
            type="button"
            onClick={() => navigate('/catalogo')}
            className="min-h-[44px] px-4 py-2 bg-night-850 hover:bg-night-800 border border-night-border text-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Volver al Catálogo</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Botón de Retorno y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/catalogo')}
          className="min-h-[44px] px-3.5 py-2 text-slate-300 hover:text-white hover:bg-night-850 border border-transparent hover:border-night-border flex items-center gap-2 text-sm font-bold transition-all focus-visible:outline-2 focus-visible:outline-amber-400 rounded-xl w-fit"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <span>Volver al Catálogo</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setModalCompraAbierto(true)}
            disabled={producto.stock <= 0}
            className="min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-sm shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            <span>{producto.stock > 0 ? 'Comprar / Realizar Pedido' : 'Sin Stock'}</span>
          </button>

          {hasRole('Administrador') && (
            <Link
              to={`/admin/productos/editar/${producto.id_Producto}`}
              className="min-h-[44px] px-4 py-2 bg-night-850 hover:bg-night-800 text-slate-200 font-bold rounded-xl text-sm flex items-center justify-center gap-2 border border-night-border hover:border-amber-500/40 transition-all focus-visible:outline-2 focus-visible:outline-white"
            >
              <Edit className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>Editar Producto</span>
            </Link>
          )}
        </div>
      </div>

      {/* Tarjeta de Ficha Técnica */}
      <article className="bg-night-850/95 border border-night-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Cabecera del Detalle: Grid con Imagen Táctica e Información Clave */}
        <div className="p-6 sm:p-8 bg-night-900/80 border-b border-night-border">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Visualización de Imagen del Producto */}
            <div className="md:col-span-5 relative group/img rounded-2xl overflow-hidden border border-night-border bg-night-950 shadow-lg">
              <ProductImage
                src={producto.imagenUrl}
                alt={producto.nombre}
                containerClassName="w-full h-64 sm:h-72"
                className="w-full h-full object-cover"
              />
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setModalImagenAbierto(true)}
                  aria-label={`Actualizar imagen de ${producto.nombre}`}
                  title="Cambiar imagen del producto"
                  className="absolute bottom-3 right-3 bg-night-950/90 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Gestionar Imagen</span>
                </button>
              )}
            </div>

            {/* Metadatos y Precios */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                  <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{producto.categoria?.nombre || 'Categoría General'}</span>
                </span>

                {producto.numeroSerie && (
                  <span className="text-xs font-mono bg-night-900 text-slate-300 border border-night-border px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Barcode className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                    <span>Serie: {producto.numeroSerie}</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {producto.nombre}
              </h1>

              <div className="flex flex-wrap items-baseline gap-6 pt-2">
                <div>
                  <span className="text-xs text-slate-400 block font-semibold">Precio de Lista (CLP)</span>
                  <span className="text-3xl font-black text-amber-400">
                    ${Number(producto.precio).toLocaleString('es-CL')}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-semibold">Disponibilidad</span>
                  <span className={`text-base font-bold ${producto.stock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {producto.stock > 0 ? `${producto.stock} unidades en inventario` : 'Sin stock disponible'}
                  </span>
                </div>
              </div>

              {/* Enlace rápido cambiar imagen para admin */}
              {isAdmin && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setModalImagenAbierto(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 underline underline-offset-4"
                  >
                    <Image className="w-3.5 h-3.5" />
                    <span>Actualizar o cambiar imagen de este producto</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cuerpo con Especificaciones y Normativas */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Descripción Técnica */}
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>Descripción Operativa</span>
            </h2>
            <p className="text-slate-200 text-sm leading-relaxed bg-night-900/90 p-4 rounded-xl border border-night-border shadow-inner">
              {producto.descripcion || 'Sin descripción técnica detallada para este artículo.'}
            </p>
          </div>

          {/* Matriz de Seguridad y Restricciones */}
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-3">
              Condiciones de Acceso y Restricción Legal
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Restricción de Edad */}
              <div className="p-4 rounded-xl bg-night-900/80 border border-night-border flex items-start gap-3">
                <AlertOctagon className={`w-6 h-6 shrink-0 mt-0.5 ${producto.restriccionEdad > 0 ? 'text-rose-400' : 'text-slate-400'}`} aria-hidden="true" />
                <div>
                  <span className="text-xs text-slate-400 block font-semibold">Restricción de Edad</span>
                  <span className="text-sm font-bold text-white">
                    {producto.restriccionEdad > 0 ? `+${producto.restriccionEdad} años requeridos` : 'Todo público'}
                  </span>
                </div>
              </div>

              {/* Requiere Permiso */}
              <div className="p-4 rounded-xl bg-night-900/80 border border-night-border flex items-start gap-3">
                <FileText className={`w-6 h-6 shrink-0 mt-0.5 ${producto.requierePermiso ? 'text-cyan-400' : 'text-slate-400'}`} aria-hidden="true" />
                <div>
                  <span className="text-xs text-slate-400 block font-semibold">Permiso Especial</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                    {producto.requierePermiso ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                        <span className="text-cyan-300">Obligatorio</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        <span className="text-slate-300">No requerido</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Solo Personal Autorizado */}
              <div className="p-4 rounded-xl bg-night-900/80 border border-night-border flex items-start gap-3">
                <ShieldCheck className={`w-6 h-6 shrink-0 mt-0.5 ${producto.soloPersonalAutorizado ? 'text-amber-400' : 'text-slate-400'}`} aria-hidden="true" />
                <div>
                  <span className="text-xs text-slate-400 block font-semibold">Uso Institucional</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                    {producto.soloPersonalAutorizado ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        <span className="text-amber-300">Personal Autorizado</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        <span className="text-slate-300">Venta Libre</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Proveedores Oficiales (TB_Proveedores y TB_ProveedoresProductos) */}
          <div className="pt-2 border-t border-night-border">
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>Cadena de Suministro y Proveedores Oficiales</span>
            </h2>

            {producto.proveedores && producto.proveedores.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {producto.proveedores.map((prov) => (
                  <div
                    key={prov.id_Proveedor || prov.id}
                    className="p-3.5 rounded-xl bg-night-900/90 border border-night-border space-y-2 shadow-inner"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                      </div>
                      <span className="font-bold text-white text-sm leading-tight">
                        {prov.nombreEmpresa}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-300 pt-1 border-t border-night-border/70">
                      {prov.contacto && (
                        <p className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-semibold">Contacto:</span>
                          <span className="text-slate-200">{prov.contacto}</span>
                        </p>
                      )}
                      {prov.telefono && (
                        <p className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-amber-400" aria-hidden="true" />
                          <span>{prov.telefono}</span>
                        </p>
                      )}
                      {prov.correo && (
                        <p className="flex items-center gap-1.5 font-mono text-[11px] truncate">
                          <Mail className="w-3 h-3 text-cyan-400" aria-hidden="true" />
                          <span className="truncate">{prov.correo}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 bg-night-900/80 p-3 rounded-xl border border-night-border italic">
                Este producto no tiene proveedores externos asociados directamente en el registro central.
              </p>
            )}
          </div>
        </div>
      </article>

      {/* Modal de Compra para Clientes */}
      <CompraModal
        producto={producto}
        isOpen={modalCompraAbierto}
        onClose={() => setModalCompraAbierto(false)}
      />

      {/* Modal de Actualización de Imagen (Exclusivo Administrador) */}
      <ActualizarImagenModal
        isOpen={modalImagenAbierto}
        onClose={() => setModalImagenAbierto(false)}
        producto={producto}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
