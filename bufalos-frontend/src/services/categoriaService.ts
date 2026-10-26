import { apiClient } from './apiClient';
import type { Categoria } from '../types';

export const categoriaService = {
  async getCategorias(): Promise<Categoria[]> {
    const response = await apiClient.get<Categoria[]>('/api/v1/categorias');
    return response.data;
  },

  async getCategoriaById(id: number): Promise<Categoria> {
    const response = await apiClient.get<Categoria>(`/api/v1/categorias/${id}`);
    return response.data;
  }
};
