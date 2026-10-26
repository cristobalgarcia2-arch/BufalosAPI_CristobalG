import { apiClient } from './apiClient';
import type {
  ServicioTecnico,
  ServicioTecnicoSeguimiento,
  TipoServicio,
  CrearServicioRequest,
  ActualizarServicioRequest,
  AgregarSeguimientoRequest
} from '../types';

export const servicioTecnicoService = {
  async getServicios(params?: { estado?: string; tecnicoId?: number }): Promise<ServicioTecnico[]> {
    const response = await apiClient.get<ServicioTecnico[]>('/api/v1/servicios-tecnicos', { params });
    return response.data;
  },

  async getTiposServicio(): Promise<TipoServicio[]> {
    const response = await apiClient.get<TipoServicio[]>('/api/v1/servicios-tecnicos/tipos');
    return response.data;
  },

  async getServicioById(id: number): Promise<ServicioTecnico> {
    const response = await apiClient.get<ServicioTecnico>(`/api/v1/servicios-tecnicos/${id}`);
    return response.data;
  },

  async crearServicio(data: CrearServicioRequest): Promise<ServicioTecnico> {
    const response = await apiClient.post<ServicioTecnico>('/api/v1/servicios-tecnicos', data);
    return response.data;
  },

  async actualizarServicio(id: number, data: ActualizarServicioRequest): Promise<ServicioTecnico> {
    const response = await apiClient.put<ServicioTecnico>(`/api/v1/servicios-tecnicos/${id}`, data);
    return response.data;
  },

  async agregarSeguimiento(id: number, data: AgregarSeguimientoRequest): Promise<ServicioTecnicoSeguimiento> {
    const response = await apiClient.post<ServicioTecnicoSeguimiento>(
      `/api/v1/servicios-tecnicos/${id}/seguimiento`,
      data
    );
    return response.data;
  }
};
