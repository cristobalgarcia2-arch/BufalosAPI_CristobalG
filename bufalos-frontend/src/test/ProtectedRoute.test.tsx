import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/guards/ProtectedRoute';
import * as AuthContextModule from '../context/AuthContext';

describe('ProtectedRoute Guard', () => {
  it('redirige a /login cuando el usuario no está autenticado', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      hasRole: () => false,
      login: vi.fn(),
      logout: vi.fn()
    });

    render(
      <MemoryRouter initialEntries={['/privado']}>
        <Routes>
          <Route path="/login" element={<div>Vista de Login</div>} />
          <Route
            path="/privado"
            element={
              <ProtectedRoute>
                <div>Contenido Privado</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Vista de Login')).toBeInTheDocument();
    expect(screen.queryByText('Contenido Privado')).not.toBeInTheDocument();
  });

  it('permite el acceso si el usuario está autenticado', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id_Usuario: 3,
        nombreCompleto: 'Cristóbal García',
        correo: 'cliente@gmail.com',
        rol: 'Cliente',
        id_Rol: 3
      },
      token: 'valid.token',
      isAuthenticated: true,
      isLoading: false,
      hasRole: (role: string) => role === 'Cliente',
      login: vi.fn(),
      logout: vi.fn()
    });

    render(
      <MemoryRouter initialEntries={['/privado']}>
        <Routes>
          <Route
            path="/privado"
            element={
              <ProtectedRoute>
                <div>Contenido Privado Permitido</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Contenido Privado Permitido')).toBeInTheDocument();
  });

  it('bloquea y redirige a /acceso-denegado si el rol es insuficiente', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id_Usuario: 3,
        nombreCompleto: 'Cristóbal García',
        correo: 'cliente@gmail.com',
        rol: 'Cliente',
        id_Rol: 3
      },
      token: 'valid.token',
      isAuthenticated: true,
      isLoading: false,
      hasRole: (role: string) => role === 'Cliente', // No es Administrador
      login: vi.fn(),
      logout: vi.fn()
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/acceso-denegado" element={<div>Acceso Denegado 403</div>} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="Administrador">
                <div>Panel Administrativo Secreto</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Acceso Denegado 403')).toBeInTheDocument();
    expect(screen.queryByText('Panel Administrativo Secreto')).not.toBeInTheDocument();
  });
});
