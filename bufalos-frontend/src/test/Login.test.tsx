import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import { authService } from '../services/authService';

vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    getPerfil: vi.fn()
  }
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>{ui}</BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('LoginPage Component', () => {
  it('renderiza correctamente el formulario con etiquetas y campos requeridos', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar al catálogo/i })).toBeInTheDocument();
  });

  it('muestra mensaje de error si se envía el formulario con datos inválidos', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const submitBtn = screen.getByRole('button', { name: /ingresar al catálogo/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/el correo electrónico es requerido/i)).toBeInTheDocument();
    });
  });

  it('llama a authService.login con credenciales válidas', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.mocked(authService.login).mockResolvedValueOnce({
      token: 'mock.jwt.token',
      usuario: {
        id_Usuario: 1,
        nombreCompleto: 'Goberto Parra',
        correo: 'admin@bufalos.cl',
        rol: 'Administrador',
        id_Rol: 1
      }
    });

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/correo electrónico/i), 'admin@bufalos.cl');
    await user.type(screen.getByLabelText(/contraseña/i), 'Admin123!');
    await user.click(screen.getByRole('button', { name: /ingresar al catálogo/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        correo: 'admin@bufalos.cl',
        password: 'Admin123!'
      });
    });
  });
});
