import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { Modal } from './Modal';
import { pedidoService } from '../../services/pedidoService';
import type { Producto, Pedido, ApiError } from '../../types';

interface CompraModalProps {
  producto: Producto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (pedido: Pedido) => void;
}

export const CompraModal: React.FC<CompraModalProps> = ({
  producto,
  isOpen,
  onClose,
  onSuccess
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [cantidad, setCantidad] = useState<number>(1);
  const [metodoEntrega, setMetodoEntrega] = useState<string>('Despacho a Domicilio');
  const [direccionEnvio, setDireccionEnvio] = useState<string>('Av. Providencia 1250, Santiago');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [pedidoCreado, setPedidoCreado] = useState<Pedido | null>(null);

  const maxStock = producto?.stock || 0;
  const precioUnitario = Number(producto?.precio || 0);
  const total = cantidad * precioUnitario;

  const compraMutation = useMutation({
    mutationFn: (data: { items: { productoId: number; cantidad: number }[]; metodoEntrega: string; direccionEnvio: string }) =>
      pedidoService.crearPedido(data),
    onSuccess: (nuevoPedido) => {
      // Sincronización inmediata entre todos los paneles del sistema
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['productos-admin'] });
      if (producto) {
        queryClient.invalidateQueries({ queryKey: ['producto', producto.id_Producto] });
      }
      queryClient.invalidateQueries({ queryKey: ['cliente-pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['tecnico-pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics-pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics-productos'] });

      setPedidoCreado(nuevoPedido);
      if (onSuccess) {
        onSuccess(nuevoPedido);
      }
    },
    onError: (err: ApiError) => {
      setErrorLocal(err.message || 'Error al procesar el pedido en el servidor.');
    }
  });

  const handleClose = () => {
    setPedidoCreado(null);
    setErrorLocal(null);
    setCantidad(1);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!producto) return;

    if (maxStock <= 0) {
      setErrorLocal('Este artículo no tiene stock disponible para despachos.');
      return;
    }

    if (cantidad < 1 || cantidad > maxStock) {
      setErrorLocal(`La cantidad debe estar entre 1 y ${maxStock}.`);
      return;
    }

    if (metodoEntrega === 'Despacho a Domicilio' && !direccionEnvio.trim()) {
      setErrorLocal('Debe ingresar una dirección de entrega válida.');
      return;
    }

    setErrorLocal(null);
    compraMutation.mutate({
      items: [
        {
          productoId: producto.id_Producto,
          cantidad
        }
      ],
      metodoEntrega,
      direccionEnvio: metodoEntrega === 'Despacho a Domicilio' ? direccionEnvio.trim() : 'Retiro en Base Central'
    });
  };

  if (!producto) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={pedidoCreado ? '¡Pedido Confirmado Exitosamente!' : `Comprar: ${producto.nombre}`}
    >
      {pedidoCreado ? (
        <div className="space-y-5 text-center py-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
            <CheckCircle2 className="w-9 h-9" aria-hidden="true" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-white">Transacción Comercial Registrada</h3>
            <p className="text-sm text-slate-300">
              Tu compra ha sido almacenada en la base de datos y ya está visible en el Panel Técnico para preparación y despacho.
            </p>
          </div>

          <div className="bg-night-900 border border-night-border rounded-xl p-4 text-left space-y-2.5 text-xs shadow-inner">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">N° Pedido:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">#{pedidoCreado.id}</span>
            </div>
            {pedidoCreado.factura && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Factura Correlativa:</span>
                <span className="font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                  {pedidoCreado.factura.numeroFactura}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Estado Inicial:</span>
              <span className="font-bold uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                {pedidoCreado.estado?.nombre || pedidoCreado.estadoPedido || 'Pendiente'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Método de Entrega:</span>
              <span className="text-slate-200 font-medium">{pedidoCreado.metodoEntrega || metodoEntrega}</span>
            </div>
            <div className="flex justify-between items-center border-t border-night-border pt-2.5 font-bold text-sm">
              <span className="text-slate-300">Monto Total:</span>
              <span className="text-amber-400 font-black text-base">${Number(pedidoCreado.total).toLocaleString('es-CL')} CLP</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                handleClose();
                navigate('/cliente');
              }}
              className="flex-1 min-h-[44px] px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)]"
            >
              Ver en Mis Pedidos
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 min-h-[44px] px-4 py-2 bg-night-800 hover:bg-night-700 text-slate-200 font-semibold rounded-lg text-sm transition-colors border border-night-border"
            >
              Seguir en el Catálogo
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Alertas de Advertencia de Rol o Stock */}
          {producto.restriccionEdad > 0 && (
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-200">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>
                Este artículo exige verificación de edad (+{producto.restriccionEdad} años) según normativas de control táctico.
              </span>
            </div>
          )}

          {producto.soloPersonalAutorizado && (
            <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-200">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                Exclusivo para Personal Autorizado (Fuerzas de Orden y Seguridad). Requiere credencial o permiso especial activo en su cuenta.
              </span>
            </div>
          )}

          {producto.requierePermiso && (
            <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-cyan-200">
              <ShieldAlert className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
              <span>
                Requiere Permiso Especial Activo (Porte de Armas / Caza o Equipamiento Regulado).
              </span>
            </div>
          )}

          {errorLocal && (
            <div className="bg-rose-950/50 border border-rose-800 rounded-xl p-3 text-xs text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorLocal}</span>
            </div>
          )}

          {/* Ficha Resumen del Producto */}
          <div className="bg-night-900/90 border border-night-border rounded-xl p-4 flex items-center justify-between gap-4 shadow-inner">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                {producto.categoria?.nombre || 'General'}
              </span>
              <h4 className="font-bold text-white text-base mt-1">{producto.nombre}</h4>
              <span className="text-xs text-slate-300">
                Stock disponible:{' '}
                <strong className={maxStock > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {maxStock} unidades
                </strong>
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs text-slate-400 block">Precio Unitario</span>
              <span className="text-lg font-black text-amber-400">
                ${precioUnitario.toLocaleString('es-CL')} CLP
              </span>
            </div>
          </div>

          {/* Selector de Cantidad */}
          <div>
            <label htmlFor="compra-cantidad" className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-1.5">
              Cantidad a Comprar
            </label>
            <div className="flex items-center gap-3">
              <input
                id="compra-cantidad"
                type="number"
                min="1"
                max={maxStock}
                value={cantidad}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCantidad(isNaN(val) ? 1 : Math.max(1, Math.min(val, maxStock)));
                }}
                disabled={maxStock <= 0}
                className="w-28 p-2.5 bg-night-900 border border-night-border rounded-lg text-sm text-white font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-center"
              />
              <span className="text-xs text-slate-300">
                (Máximo permitido por pedido: {maxStock} unidades)
              </span>
            </div>
          </div>

          {/* Método de Entrega */}
          <div>
            <label htmlFor="compra-metodo" className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-1.5">
              Método de Entrega
            </label>
            <div className="relative">
              <select
                id="compra-metodo"
                value={metodoEntrega}
                onChange={(e) => setMetodoEntrega(e.target.value)}
                className="w-full p-2.5 pl-3 bg-night-900 border border-night-border rounded-lg text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              >
                <option value="Despacho a Domicilio" className="bg-night-900 text-white">Despacho a Domicilio (Transporte Blindado)</option>
                <option value="Retiro en Base Central" className="bg-night-900 text-white">Retiro en Base Operativa Búfalos Tactical</option>
              </select>
            </div>
          </div>

          {/* Dirección de Envío */}
          {metodoEntrega === 'Despacho a Domicilio' && (
            <div>
              <label htmlFor="compra-direccion" className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-1.5">
                Dirección de Destino <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-400/70">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  id="compra-direccion"
                  type="text"
                  value={direccionEnvio}
                  onChange={(e) => setDireccionEnvio(e.target.value)}
                  placeholder="Calle, número, depto, comuna y región..."
                  required
                  className="w-full pl-9 pr-3 py-2 bg-night-900 border border-night-border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          )}

          {/* Resumen Total */}
          <div className="border-t border-night-border pt-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Total a Pagar (IVA Incluido)</span>
              <span className="text-2xl font-black text-amber-400">
                ${total.toLocaleString('es-CL')} CLP
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="min-h-[44px] px-4 py-2 bg-night-800 hover:bg-night-700 text-slate-200 font-semibold rounded-lg text-sm transition-colors border border-night-border"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={compraMutation.isPending || maxStock <= 0}
                className="min-h-[44px] px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black rounded-lg text-sm shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{compraMutation.isPending ? 'Procesando...' : 'Confirmar Pedido'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
