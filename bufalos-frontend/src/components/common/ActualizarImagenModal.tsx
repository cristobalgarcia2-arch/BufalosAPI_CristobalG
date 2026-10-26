import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Check, AlertTriangle, Sparkles, X, Link as LinkIcon } from 'lucide-react';
import { Modal } from './Modal';
import { ProductImage, TACTICAL_PRESET_IMAGES } from './ProductImage';
import { productoService } from '../../services/productoService';
import type { Producto, ApiError } from '../../types';

interface ActualizarImagenModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto | null;
  onSuccess?: (nuevoUrl: string) => void;
}

export const ActualizarImagenModal: React.FC<ActualizarImagenModalProps> = ({
  isOpen,
  onClose,
  producto,
  onSuccess
}) => {
  const queryClient = useQueryClient();
  const [urlInput, setUrlInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (producto) {
      setUrlInput(producto.imagenUrl || '');
      setErrorMsg(null);
    }
  }, [producto, isOpen]);

  const updateMutation = useMutation({
    mutationFn: async (nuevaUrl: string) => {
      if (!producto) throw new Error('No hay producto seleccionado.');
      return productoService.actualizarProducto(producto.id_Producto, {
        nombre: producto.nombre,
        descripcion: producto.descripcion || null,
        precio: Number(producto.precio),
        stock: Number(producto.stock),
        id_Categoria: Number(producto.id_Categoria),
        restriccionEdad: Number(producto.restriccionEdad),
        requierePermiso: Boolean(producto.requierePermiso),
        soloPersonalAutorizado: Boolean(producto.soloPersonalAutorizado),
        numeroSerie: producto.numeroSerie || null,
        imagenUrl: nuevaUrl.trim() || null
      });
    },
    onSuccess: (updatedProd) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['producto', producto?.id_Producto] });
      queryClient.invalidateQueries({ queryKey: ['productos-admin'] });
      if (onSuccess && updatedProd.imagenUrl) {
        onSuccess(updatedProd.imagenUrl);
      }
      onClose();
    },
    onError: (err: ApiError) => {
      setErrorMsg(err.message || 'Error al persistir la imagen en la API.');
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      setErrorMsg('El archivo seleccionado supera el límite recomendado de 2.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setUrlInput(result);
      setErrorMsg(null);
    };
    reader.onerror = () => {
      setErrorMsg('No fue posible leer el archivo de imagen seleccionado.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setErrorMsg(null);
    updateMutation.mutate(urlInput);
  };

  if (!producto) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Gestión de Imagen Táctica #${producto.id_Producto} - ${producto.nombre}`}
    >
      <div className="space-y-5">
        {errorMsg && (
          <div
            role="alert"
            className="p-3 bg-rose-950/70 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Vista Previa de la Imagen */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-night-900/80 p-4 rounded-xl border border-night-border">
          <div className="w-36 h-36 rounded-xl overflow-hidden border-2 border-amber-500/40 shrink-0 bg-night-950 shadow-md">
            <ProductImage
              src={urlInput}
              alt={producto.nombre}
              containerClassName="w-full h-full"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full inline-block">
              {producto.categoria?.nombre || 'Equipamiento Táctico'}
            </span>
            <h4 className="text-sm font-bold text-white truncate">{producto.nombre}</h4>
            <p className="text-xs text-slate-300">
              Vista previa interactiva. Se guardará de inmediato en el catálogo comercial e inventario.
            </p>
            {urlInput && (
              <button
                type="button"
                onClick={() => setUrlInput('')}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 mx-auto sm:mx-0 pt-1"
              >
                <X className="w-3 h-3" />
                <span>Restablecer a imagen por defecto</span>
              </button>
            )}
          </div>
        </div>

        {/* Ingreso de URL */}
        <div className="space-y-1.5">
          <label htmlFor="url-imagen-input" className="block text-xs font-bold uppercase tracking-wider text-amber-400">
            URL Directa de la Imagen
          </label>
          <div className="relative">
            <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="url-imagen-input"
              type="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="https://ejemplo.com/imagenes/tactico.jpg"
              className="w-full pl-9 pr-3 py-2 bg-night-900 border border-night-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* Carga de Archivo Local */}
        <div className="space-y-1.5">
          <label htmlFor="file-imagen-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            O Cargar Archivo Local desde el Equipo
          </label>
          <div className="flex items-center gap-3">
            <label
              htmlFor="file-imagen-input"
              className="cursor-pointer min-h-[36px] px-3.5 py-1.5 bg-night-850 hover:bg-night-800 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Seleccionar Archivo</span>
            </label>
            <input
              id="file-imagen-input"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="sr-only"
            />
            <span className="text-[11px] text-slate-400">Formatos recomendados: JPG, PNG, WebP</span>
          </div>
        </div>

        {/* Presets Tácticos Sugeridos */}
        <div className="space-y-2 pt-2 border-t border-night-border">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>O seleccionar imagen táctica sugerida</span>
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TACTICAL_PRESET_IMAGES.map((preset) => (
              <button
                key={preset.titulo}
                type="button"
                onClick={() => {
                  setUrlInput(preset.url);
                  setErrorMsg(null);
                }}
                className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                  urlInput === preset.url
                    ? 'border-amber-400 bg-amber-500/15 text-white'
                    : 'border-night-border bg-night-900/60 hover:bg-night-800 text-slate-300'
                }`}
              >
                <img
                  src={preset.url}
                  alt={preset.titulo}
                  className="w-8 h-8 rounded-md object-cover border border-night-border shrink-0"
                />
                <span className="text-[11px] font-semibold truncate">{preset.titulo}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-night-border">
          <button
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="px-4 py-2 bg-night-800 hover:bg-night-700 text-slate-200 border border-night-border font-bold rounded-xl text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{updateMutation.isPending ? 'Guardando en API...' : 'Guardar Imagen'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
