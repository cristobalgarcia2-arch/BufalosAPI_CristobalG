import { apiClient } from './apiClient';
import type { Producto, ProductosPaginadosResponse, Proveedor } from '../types';

export interface QueryProductosParams {
  buscar?: string;
  idCategoria?: number;
  precioMin?: number;
  precioMax?: number;
  soloConStock?: boolean;
  pagina?: number;
  limite?: number;
}

export type ProductoInput = Omit<Producto, 'id_Producto' | 'categoria'>;

const LOCAL_STORAGE_IMAGES_KEY = 'bufalos_product_images';

export function getStoredProductImages(): Record<number, string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_IMAGES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredProductImage(id: number, imagenUrl: string | null | undefined): void {
  try {
    const current = getStoredProductImages();
    if (imagenUrl && imagenUrl.trim()) {
      current[id] = imagenUrl.trim();
    } else {
      delete current[id];
    }
    localStorage.setItem(LOCAL_STORAGE_IMAGES_KEY, JSON.stringify(current));
  } catch {
    // Manejo seguro de cuotas de almacenamiento
  }
}

function mergeProductImage(prod: Producto): Producto {
  const stored = getStoredProductImages();
  const customImg = stored[prod.id_Producto];
  return {
    ...prod,
    imagenUrl: customImg || prod.imagenUrl || null
  };
}

export const productoService = {
  async getProductos(params?: QueryProductosParams): Promise<ProductosPaginadosResponse> {
    const response = await apiClient.get<ProductosPaginadosResponse>('/api/v1/productos', {
      params
    });
    return {
      ...response.data,
      items: (response.data.items || []).map(mergeProductImage)
    };
  },

  async getProductoById(id: number): Promise<Producto> {
    const response = await apiClient.get<Producto>(`/api/v1/productos/${id}`);
    return mergeProductImage(response.data);
  },

  async getProveedores(): Promise<Proveedor[]> {
    const response = await apiClient.get<Proveedor[]>('/api/v1/proveedores');
    return response.data;
  },

  async crearProducto(data: ProductoInput): Promise<Producto> {
    const response = await apiClient.post<Producto>('/api/v1/productos', data);
    const created = response.data;
    if (data.imagenUrl) {
      saveStoredProductImage(created.id_Producto, data.imagenUrl);
    }
    return mergeProductImage(created);
  },

  async actualizarProducto(id: number, data: ProductoInput): Promise<Producto> {
    const response = await apiClient.put<Producto>(`/api/v1/productos/${id}`, data);
    if (data.imagenUrl !== undefined) {
      saveStoredProductImage(id, data.imagenUrl);
    }
    return mergeProductImage({
      ...response.data,
      imagenUrl: data.imagenUrl ?? response.data.imagenUrl
    });
  },

  async eliminarProducto(id: number): Promise<{ mensaje: string }> {
    const response = await apiClient.delete<{ mensaje: string }>(`/api/v1/productos/${id}`);
    saveStoredProductImage(id, null);
    return response.data;
  }
};
