import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, AlertTriangle, Package, Image as ImageIcon, Upload, Link as LinkIcon, Sparkles, X, Building2 } from 'lucide-react';
import { productoService } from '../../services/productoService';
import { categoriaService } from '../../services/categoriaService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ProductImage, TACTICAL_PRESET_IMAGES } from '../../components/common/ProductImage';
import type { ApiError } from '../../types';

const productoSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'El nombre no puede superar los 150 caracteres'),
  descripcion: z.string().optional(),
  precio: z.coerce
    .number({ invalid_type_error: 'El precio debe ser un número' })
    .positive('El precio debe ser mayor a 0'),
  stock: z.coerce
    .number({ invalid_type_error: 'El stock debe ser un número' })
    .min(0, 'El stock no puede ser negativo'),
  id_Categoria: z.coerce
    .number({ invalid_type_error: 'Debe seleccionar una categoría' })
    .positive('Debe seleccionar una categoría válida'),
  restriccionEdad: z.coerce
    .number({ invalid_type_error: 'Debe ser un número' })
    .min(0, 'La restricción mínima es 0 años')
    .max(99, 'La restricción máxima es 99 años'),
  requierePermiso: z.boolean(),
  soloPersonalAutorizado: z.boolean(),
  numeroSerie: z.string().optional(),
  imagenUrl: z.string().optional(),
  proveedorIds: z.array(z.number())
});

type ProductoFormValues = z.infer<typeof productoSchema>;

export const ProductoFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const productoId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  // Consulta de categorías
  const { data: categorias = [], isLoading: isLoadingCategorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => categoriaService.getCategorias()
  });

  // Consulta de proveedores disponibles
  const { data: proveedores = [], isLoading: isLoadingProveedores } = useQuery({
    queryKey: ['proveedores'],
    queryFn: () => productoService.getProveedores()
  });

  // Consulta de producto si estamos en modo edición
  const { data: existingProducto, isLoading: isLoadingProducto } = useQuery({
    queryKey: ['producto', productoId],
    queryFn: () => productoService.getProductoById(productoId),
    enabled: isEditing && !isNaN(productoId) && productoId > 0
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      id_Categoria: 1,
      restriccionEdad: 0,
      requierePermiso: false,
      soloPersonalAutorizado: false,
      numeroSerie: '',
      imagenUrl: '',
      proveedorIds: []
    }
  });

  const currentImagenUrl = watch('imagenUrl') || '';
  const selectedProveedorIds = watch('proveedorIds') || [];

  useEffect(() => {
    if (existingProducto) {
      const pIds = (existingProducto.proveedores || []).map((p) => p.id_Proveedor || p.id || 0).filter((id) => id > 0);
      reset({
        nombre: existingProducto.nombre,
        descripcion: existingProducto.descripcion || '',
        precio: Number(existingProducto.precio),
        stock: existingProducto.stock,
        id_Categoria: existingProducto.id_Categoria,
        restriccionEdad: existingProducto.restriccionEdad,
        requierePermiso: !!existingProducto.requierePermiso,
        soloPersonalAutorizado: !!existingProducto.soloPersonalAutorizado,
        numeroSerie: existingProducto.numeroSerie || '',
        imagenUrl: existingProducto.imagenUrl || '',
        proveedorIds: pIds
      });
    }
  }, [existingProducto, reset]);

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      setServerError('El archivo de imagen no debe superar los 2.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setValue('imagenUrl', reader.result as string, { shouldDirty: true });
      setServerError(null);
    };
    reader.onerror = () => {
      setServerError('No fue posible procesar el archivo de imagen.');
    };
    reader.readAsDataURL(file);
  };

  // Mutación para Crear o Actualizar
  const saveMutation = useMutation({
    mutationFn: (values: ProductoFormValues) => {
      const payload = {
        nombre: values.nombre,
        descripcion: values.descripcion || null,
        precio: values.precio,
        stock: values.stock,
        id_Categoria: values.id_Categoria,
        restriccionEdad: values.restriccionEdad,
        requierePermiso: values.requierePermiso,
        soloPersonalAutorizado: values.soloPersonalAutorizado,
        numeroSerie: values.numeroSerie || null,
        imagenUrl: values.imagenUrl?.trim() || null,
        proveedorIds: values.proveedorIds || []
      };

      if (isEditing) {
        return productoService.actualizarProducto(productoId, payload);
      }
      return productoService.crearProducto(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['producto', productoId] });
      queryClient.invalidateQueries({ queryKey: ['productos-admin'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics-productos'] });
      navigate('/catalogo');
    },
    onError: (err: ApiError) => {
      setServerError(err.message || 'Error al persistir el producto en la API.');
    }
  });

  const onSubmit = (values: ProductoFormValues) => {
    setServerError(null);
    saveMutation.mutate(values);
  };

  if ((isEditing && isLoadingProducto) || isLoadingCategorias) {
    return (
      <div className="py-16">
        <LoadingSpinner text="Preparando formulario de producto..." size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Botón Volver */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/productos"
          className="min-h-[44px] px-3.5 py-2 text-slate-300 hover:text-white hover:bg-night-850 border border-transparent hover:border-night-border flex items-center gap-2 text-sm font-bold transition-all focus-visible:outline-2 focus-visible:outline-amber-400 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <span>Volver a la Administración</span>
        </Link>
      </div>

      <div className="bg-night-850/95 border border-night-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-6 sm:p-8">
        <div className="border-b border-night-border pb-5 mb-6">
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Package className="w-6 h-6 text-amber-400" aria-hidden="true" />
            <span>{isEditing ? `Editar Producto #${productoId}` : 'Crear Nuevo Producto Táctico'}</span>
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Complete los campos obligatorios para actualizar el catálogo oficial de la tienda.
          </p>
        </div>

        {/* Mensaje de Error de Validación o API */}
        {serverError && (
          <div
            role="alert"
            aria-live="assertive"
            className="p-4 mb-6 bg-rose-950/70 border border-rose-800 text-rose-200 text-sm rounded-xl flex items-start gap-3 shadow-md"
          >
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Formulario Accesible con Etiquetas y Anuncio de Errores */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          {/* Nombre del Producto */}
          <div>
            <label htmlFor="nombre-input" className="block text-sm font-bold text-white mb-1.5">
              Nombre del Artículo <span className="text-amber-400">*</span>
            </label>
            <input
              id="nombre-input"
              type="text"
              aria-required="true"
              aria-invalid={!!errors.nombre}
              aria-describedby={errors.nombre ? 'nombre-error' : undefined}
              {...register('nombre')}
              className={`w-full px-4 py-2.5 bg-night-900 border rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-colors ${
                errors.nombre ? 'border-rose-500' : 'border-night-border'
              }`}
              placeholder="Ej. Casco Balístico Nivel III-A"
            />
            {errors.nombre && (
              <p id="nombre-error" role="alert" className="mt-1 text-xs text-rose-400 font-semibold">
                {errors.nombre.message}
              </p>
            )}
          </div>

          {/* Categoría */}
          <div>
            <label htmlFor="categoria-input" className="block text-sm font-bold text-white mb-1.5">
              Categoría de Clasificación <span className="text-amber-400">*</span>
            </label>
            <select
              id="categoria-input"
              aria-required="true"
              aria-invalid={!!errors.id_Categoria}
              aria-describedby={errors.id_Categoria ? 'categoria-error' : undefined}
              {...register('id_Categoria')}
              className={`w-full px-4 py-2.5 bg-night-900 border rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-colors ${
                errors.id_Categoria ? 'border-rose-500' : 'border-night-border'
              }`}
            >
              {categorias.map((c) => (
                <option key={c.id_Categoria} value={c.id_Categoria} className="bg-night-900 text-white">
                  {c.nombre}
                </option>
              ))}
            </select>
            {errors.id_Categoria && (
              <p id="categoria-error" role="alert" className="mt-1 text-xs text-rose-400 font-semibold">
                {errors.id_Categoria.message}
              </p>
            )}
          </div>

          {/* Precio y Stock en Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="precio-input" className="block text-sm font-bold text-white mb-1.5">
                Precio Unitario (CLP) <span className="text-amber-400">*</span>
              </label>
              <input
                id="precio-input"
                type="number"
                step="100"
                aria-required="true"
                aria-invalid={!!errors.precio}
                aria-describedby={errors.precio ? 'precio-error' : undefined}
                {...register('precio')}
                className={`w-full px-4 py-2.5 bg-night-900 border rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400 ${
                  errors.precio ? 'border-rose-500' : 'border-night-border'
                }`}
                placeholder="0"
              />
              {errors.precio && (
                <p id="precio-error" role="alert" className="mt-1 text-xs text-rose-400 font-semibold">
                  {errors.precio.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="stock-input" className="block text-sm font-bold text-white mb-1.5">
                Cantidad en Stock <span className="text-amber-400">*</span>
              </label>
              <input
                id="stock-input"
                type="number"
                aria-required="true"
                aria-invalid={!!errors.stock}
                aria-describedby={errors.stock ? 'stock-error' : undefined}
                {...register('stock')}
                className={`w-full px-4 py-2.5 bg-night-900 border rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400 ${
                  errors.stock ? 'border-rose-500' : 'border-night-border'
                }`}
                placeholder="0"
              />
              {errors.stock && (
                <p id="stock-error" role="alert" className="mt-1 text-xs text-rose-400 font-semibold">
                  {errors.stock.message}
                </p>
              )}
            </div>
          </div>

          {/* Restricción de Edad y Número de Serie */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edad-input" className="block text-sm font-bold text-white mb-1.5">
                Restricción de Edad (Años)
              </label>
              <input
                id="edad-input"
                type="number"
                aria-invalid={!!errors.restriccionEdad}
                aria-describedby={errors.restriccionEdad ? 'edad-error' : undefined}
                {...register('restriccionEdad')}
                className="w-full px-4 py-2.5 bg-night-900 border border-night-border rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                placeholder="0 si es para todo público"
              />
              {errors.restriccionEdad && (
                <p id="edad-error" role="alert" className="mt-1 text-xs text-rose-400 font-semibold">
                  {errors.restriccionEdad.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="serie-input" className="block text-sm font-bold text-white mb-1.5">
                Número de Serie / Lote (Opcional)
              </label>
              <input
                id="serie-input"
                type="text"
                {...register('numeroSerie')}
                className="w-full px-4 py-2.5 bg-night-900 border border-night-border rounded-xl text-sm text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                placeholder="Ej. BAL-2026-X01"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="descripcion-input" className="block text-sm font-bold text-white mb-1.5">
              Descripción y Ficha Técnica
            </label>
            <textarea
              id="descripcion-input"
              rows={3}
              {...register('descripcion')}
              className="w-full px-4 py-2.5 bg-night-900 border border-night-border rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400 placeholder-slate-500"
              placeholder="Detalle materiales, normativas balísticas o características operativas..."
            />
          </div>

          {/* Imagen del Producto (URL o Carga Local con Vista Previa) */}
          <div className="bg-night-900/90 border border-night-border rounded-xl p-5 space-y-4 shadow-inner">
            <div className="flex items-center justify-between border-b border-night-border pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Imagen del Producto Táctico</span>
              </span>
              {currentImagenUrl && (
                <button
                  type="button"
                  onClick={() => setValue('imagenUrl', '', { shouldDirty: true })}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Quitar imagen personalizada</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Caja de Vista Previa */}
              <div className="md:col-span-4 flex flex-col items-center">
                <div className="w-36 h-36 rounded-xl overflow-hidden border-2 border-amber-500/40 bg-night-950 shadow-md">
                  <ProductImage
                    src={currentImagenUrl}
                    alt="Vista previa del producto"
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-2 font-mono">
                  {currentImagenUrl ? 'Vista previa activa' : 'Placeholder táctico'}
                </span>
              </div>

              {/* Controles de URL y Carga */}
              <div className="md:col-span-8 space-y-3">
                <div>
                  <label htmlFor="imagenUrl-input" className="block text-xs font-bold text-slate-200 mb-1">
                    URL de la Imagen Web
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      id="imagenUrl-input"
                      type="url"
                      {...register('imagenUrl')}
                      placeholder="https://ejemplo.com/imagenes/articulo-tactico.jpg"
                      className="w-full pl-9 pr-3 py-2 bg-night-950 border border-night-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="file-upload-form" className="block text-xs font-bold text-slate-200 mb-1">
                    O Cargar Archivo Local desde tu Equipo
                  </label>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="file-upload-form"
                      className="cursor-pointer min-h-[36px] px-3.5 py-1.5 bg-night-850 hover:bg-night-800 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Examinar Archivo</span>
                    </label>
                    <input
                      id="file-upload-form"
                      type="file"
                      accept="image/*"
                      onChange={handleLocalImageUpload}
                      className="sr-only"
                    />
                    <span className="text-[11px] text-slate-400">JPG, PNG, WebP (máx. 2.5MB)</span>
                  </div>
                </div>

                {/* Presets Tácticos Sugeridos */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1 mb-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>O seleccionar una imagen sugerida:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {TACTICAL_PRESET_IMAGES.slice(0, 4).map((preset) => (
                      <button
                        key={preset.titulo}
                        type="button"
                        onClick={() => setValue('imagenUrl', preset.url, { shouldDirty: true })}
                        className="text-[11px] px-2.5 py-1 bg-night-850 hover:bg-night-800 text-slate-200 border border-night-border hover:border-amber-400/50 rounded-lg transition-colors font-medium"
                      >
                        {preset.titulo}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección Proveedores Oficiales (TB_Proveedores y TB_ProveedoresProductos) */}
          <div className="bg-night-900/90 border border-night-border rounded-xl p-4 space-y-3 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-night-border pb-2.5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                  <span>Proveedores Oficiales Asociados (TB_Proveedores)</span>
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  Seleccione uno o más proveedores que suministran este artículo táctico.
                </p>
              </div>
              <span className="text-xs font-mono bg-night-950 border border-night-border px-2.5 py-1 rounded-lg text-amber-300 font-bold w-fit">
                {selectedProveedorIds.length} seleccionado(s)
              </span>
            </div>

            {isLoadingProveedores ? (
              <div className="py-3 text-center text-xs text-slate-400">Cargando proveedores oficiales...</div>
            ) : proveedores.length === 0 ? (
              <div className="text-xs text-slate-400 italic">No hay proveedores registrados en la base de datos.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {proveedores.map((prov) => {
                  const idProv = prov.id_Proveedor || prov.id || 0;
                  const isChecked = selectedProveedorIds.includes(idProv);
                  return (
                    <label
                      key={idProv}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                          : 'bg-night-950 border-night-border hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...selectedProveedorIds, idProv]
                            : selectedProveedorIds.filter((pId) => pId !== idProv);
                          setValue('proveedorIds', next, { shouldDirty: true });
                        }}
                        className="mt-0.5 w-4 h-4 rounded border-night-border text-amber-500 focus:ring-amber-400 bg-night-800"
                      />
                      <div className="flex flex-col text-xs leading-tight">
                        <span className="font-bold text-white text-sm">{prov.nombreEmpresa}</span>
                        {prov.contacto && <span className="text-slate-300 mt-0.5">Contacto: {prov.contacto}</span>}
                        {prov.telefono && <span className="text-slate-400 font-mono text-[11px] mt-0.5">Tel: {prov.telefono}</span>}
                        {prov.correo && <span className="text-slate-400 font-mono text-[11px]">{prov.correo}</span>}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Checks de Restricciones Operativas */}
          <div className="bg-night-900/90 border border-night-border rounded-xl p-4 space-y-3 shadow-inner">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-2">
              Controles y Regulaciones de Venta
            </span>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('requierePermiso')}
                className="w-5 h-5 rounded border-night-border text-amber-500 focus:ring-amber-400 bg-night-800"
              />
              <span className="text-sm text-slate-200 font-medium">
                Requiere Permiso Especial de Porte o Control de Armamento
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('soloPersonalAutorizado')}
                className="w-5 h-5 rounded border-night-border text-amber-500 focus:ring-amber-400 bg-night-800"
              />
              <span className="text-sm text-slate-200 font-medium">
                Exclusivo para Personal Autorizado (Fuerzas de Orden / Seguridad)
              </span>
            </label>
          </div>

          {/* Botones de Envío */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-night-border">
            <Link
              to="/admin/productos"
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-night-800 hover:bg-night-700 text-slate-200 border border-night-border font-bold rounded-xl text-sm transition-colors flex items-center justify-center focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || saveMutation.isPending}
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:bg-amber-600 text-slate-950 font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.25)] focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50"
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              <span>{isSubmitting || saveMutation.isPending ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Registrar Producto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
