import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { CatalogoPage } from '../pages/CatalogoPage';
import { productoService } from '../services/productoService';
import { categoriaService } from '../services/categoriaService';

vi.mock('../services/productoService', () => ({
  productoService: {
    getProductos: vi.fn(),
    getProductoById: vi.fn(),
    crearProducto: vi.fn(),
    actualizarProducto: vi.fn(),
    eliminarProducto: vi.fn()
  }
}));

vi.mock('../services/categoriaService', () => ({
  categoriaService: {
    getCategorias: vi.fn(),
    getCategoriaById: vi.fn()
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

describe('CatalogoPage Component', () => {
  it('renderiza productos y categorías correctamente desde la API simulada', async () => {
    vi.mocked(categoriaService.getCategorias).mockResolvedValueOnce([
      { id_Categoria: 1, nombre: 'Equipamiento Táctico' }
    ]);

    vi.mocked(productoService.getProductos).mockResolvedValueOnce({
      total: 1,
      pagina: 1,
      limite: 6,
      totalPaginas: 1,
      items: [
        {
          id_Producto: 1,
          nombre: 'Casco Táctico Kevlar',
          descripcion: 'Protección balística de alta resistencia',
          precio: 185000,
          stock: 12,
          id_Categoria: 1,
          restriccionEdad: 18,
          requierePermiso: false,
          soloPersonalAutorizado: false,
          numeroSerie: 'CAS-2026-X99',
          categoria: { id_Categoria: 1, nombre: 'Equipamiento Táctico' }
        }
      ]
    });

    renderWithProviders(<CatalogoPage />);

    // Verificar que el título principal y el buscador se encuentran presentes
    expect(screen.getByRole('heading', { name: /catálogo de equipamiento táctico/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/buscar por nombre o descripción/i)).toBeInTheDocument();

    // Esperar a que el producto simulado aparezca en la vista
    await waitFor(() => {
      expect(screen.getByText('Casco Táctico Kevlar')).toBeInTheDocument();
      expect(screen.getByText(/protección balística de alta resistencia/i)).toBeInTheDocument();
      expect(screen.getByText('+18 años')).toBeInTheDocument();
    });
  });

  it('muestra estado vacío cuando no hay registros devueltos', async () => {
    vi.mocked(categoriaService.getCategorias).mockResolvedValueOnce([]);
    vi.mocked(productoService.getProductos).mockResolvedValueOnce({
      total: 0,
      pagina: 1,
      limite: 6,
      totalPaginas: 1,
      items: []
    });

    renderWithProviders(<CatalogoPage />);

    await waitFor(() => {
      expect(screen.getByText(/no se encontraron productos/i)).toBeInTheDocument();
    });
  });

  it('permite interactuar con los campos de precio y el selector de stock', async () => {
    vi.mocked(categoriaService.getCategorias).mockResolvedValueOnce([]);
    vi.mocked(productoService.getProductos).mockResolvedValueOnce({
      total: 0,
      pagina: 1,
      limite: 6,
      totalPaginas: 1,
      items: []
    });

    renderWithProviders(<CatalogoPage />);

    expect(screen.getByLabelText(/precio mínimo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/precio máximo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/solo con stock/i)).toBeInTheDocument();
  });
});

