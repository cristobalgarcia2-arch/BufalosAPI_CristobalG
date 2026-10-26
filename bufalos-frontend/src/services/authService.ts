import { apiClient } from './apiClient';
import type { AuthResponse, LoginCredentials, Usuario } from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/usuarios/login', credentials);
    return response.data;
  },

  async registro(data: import('../types').RegistroCredentials): Promise<{ id_Usuario: number; nombreCompleto: string; correo: string; id_Rol: number }> {
    const response = await apiClient.post('/api/v1/usuarios/registro', {
      nombreCompleto: data.nombreCompleto,
      correo: data.correo,
      password: data.password,
      id_Rol: data.id_Rol,
      fechaNacimiento: data.fechaNacimiento || '2000-01-01T00:00:00Z',
      esVerificado: true
    });
    return response.data;
  },

  async getPerfil(): Promise<Usuario> {
    const response = await apiClient.get<Usuario>('/api/v1/usuarios/perfil');
    return response.data;
  },

  async getTecnicos(): Promise<Usuario[]> {
    const response = await apiClient.get<Usuario[]>('/api/v1/usuarios/tecnicos');
    return response.data;
  }
};
