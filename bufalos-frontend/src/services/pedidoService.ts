import { apiClient } from './apiClient';
import type { Pedido, EstadoPedido, CrearPedidoRequest } from '../types';

export const pedidoService = {
  async getPedidos(params?: { usuarioId?: number; estadoId?: number }): Promise<Pedido[]> {
    const response = await apiClient.get<Pedido[]>('/api/v1/pedidos', { params });
    return response.data;
  },

  async getPedidoById(id: number): Promise<Pedido> {
    const response = await apiClient.get<Pedido>(`/api/v1/pedidos/${id}`);
    return response.data;
  },

  async getEstados(): Promise<EstadoPedido[]> {
    const response = await apiClient.get<EstadoPedido[]>('/api/v1/pedidos/estados');
    return response.data;
  },

  async crearPedido(data: CrearPedidoRequest): Promise<Pedido> {
    const response = await apiClient.post<Pedido>('/api/v1/pedidos', data);
    return response.data;
  },

  async actualizarEstadoPedido(
    id: number,
    payload: number | { estadoId?: number; estado?: string }
  ): Promise<{ mensaje: string; estadoId?: number; estado?: string }> {
    const body = typeof payload === 'number' ? { estadoId: payload } : payload;
    const response = await apiClient.put<{ mensaje: string; estadoId?: number; estado?: string }>(
      `/api/v1/pedidos/${id}/estado`,
      body
    );
    return response.data;
  }
};
