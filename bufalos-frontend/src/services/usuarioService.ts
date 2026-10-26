import { apiClient } from './apiClient';
import type { Usuario, PermisoUsuario } from '../types';

export interface OtorgarPermisoRequest {
  tipoPermiso: string;
  numeroDocumento?: string;
  fechaExpiracion?: string;
}

export const usuarioService = {
  async getUsuarios(): Promise<Usuario[]> {
    const response = await apiClient.get<Usuario[]>('/api/v1/usuarios');
    return response.data;
  },

  async cambiarEstadoUsuario(id: number, esVerificado: boolean): Promise<{ mensaje: string; id_Usuario: number; esVerificado: boolean }> {
    const response = await apiClient.put<{ mensaje: string; id_Usuario: number; esVerificado: boolean }>(
      `/api/v1/usuarios/${id}/estado`,
      { esVerificado }
    );
    return response.data;
  },

  async otorgarPermiso(id: number, data: OtorgarPermisoRequest): Promise<PermisoUsuario> {
    const response = await apiClient.post<PermisoUsuario>(`/api/v1/usuarios/${id}/permisos`, data);
    return response.data;
  },

  async revocarPermiso(usuarioId: number, permisoId: number): Promise<{ mensaje: string }> {
    const response = await apiClient.delete<{ mensaje: string }>(`/api/v1/usuarios/${usuarioId}/permisos/${permisoId}`);
    return response.data;
  }
};
