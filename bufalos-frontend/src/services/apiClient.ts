import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:51800';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  timeout: 15000
});

// Interceptor de petición: adjunta el token JWT Bearer si existe
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('bufalos_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta: normaliza errores y maneja 401/403/429
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ status?: number; error?: string; message?: string; mensaje?: string; errors?: Record<string, string> }>) => {
    const hasResponse = !!error.response;
    const status = error.response?.status || 500;
    const data = error.response?.data;

    let message = 'Error de conexión con el servidor. Verifique si la API está en ejecución.';
    if (!hasResponse) {
      message = 'No se pudo conectar con la API backend (http://localhost:51800). Asegúrese de iniciar el backend con "dotnet run".';
    } else if (data?.mensaje) {
      message = data.mensaje;
    } else if (data?.message) {
      message = data.message;
    } else if (status === 401) {
      message = 'Credenciales incorrectas o sesión expirada.';
    } else if (status === 403) {
      message = 'No tiene los permisos requeridos para realizar esta acción (Acceso Denegado).';
    } else if (status === 429) {
      message = 'Límite de peticiones excedido (Rate Limit). Por favor espere 1 minuto antes de reintentar.';
    } else if (status >= 500) {
      message = 'Ocurrió un error interno en el servidor. Por favor intente más tarde.';
    }

    const normalizedError: ApiError = {
      status,
      message,
      errors: data?.errors
    };

    // Manejo de expiración o token inválido (401)
    if (status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('bufalos_token');
      localStorage.removeItem('bufalos_user');
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    return Promise.reject(normalizedError);
  }
);
