import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import type { LoginCredentials, Usuario } from '../types';

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: string) => boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('bufalos_token'));
  const [user, setUser] = useState<Usuario | null>(() => {
    const savedUser = localStorage.getItem('bufalos_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser) as Usuario;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Escuchar evento de expiración de sesión despachado por el interceptor HTTP
  useEffect(() => {
    const handleExpired = () => {
      logout();
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const profile = await authService.getPerfil();
          setUser(profile);
          localStorage.setItem('bufalos_user', JSON.stringify(profile));
        } catch {
          // Si el token es inválido o expiró, limpia el estado
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (credentials: LoginCredentials) => {
    const data = await authService.login(credentials);
    setToken(data.token);
    setUser(data.usuario);
    localStorage.setItem('bufalos_token', data.token);
    localStorage.setItem('bufalos_user', JSON.stringify(data.usuario));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bufalos_token');
    localStorage.removeItem('bufalos_user');
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    const normalize = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalize(user.rol) === normalize(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        hasRole,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
