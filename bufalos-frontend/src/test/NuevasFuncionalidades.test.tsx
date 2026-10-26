import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { LoginPage } from '../pages/LoginPage';
import { CatalogoPage } from '../pages/CatalogoPage';
import { Navbar } from '../components/layout/Navbar';
import { TecnicoPanelPage } from '../pages/tecnico/TecnicoPanelPage';
import { authService } from '../services/authService';
import { productoService } from '../services/productoService';
import { categoriaService } from '../services/categoriaService';
import { servicioTecnicoService } from '../services/servicioTecnicoService';
import { pedidoService } from '../services/pedidoService';

vi.mock('../services/servicioTecnicoService', () => ({
  servicioTecnicoService: {
    getServicios: vi.fn(),
    actualizarServicio: vi.fn(),
    agregarSeguimiento: vi.fn()
  }
}));

vi.mock('../services/pedidoService', () => ({
  pedidoService: {
    getPedidos: vi.fn(),
    actualizarEstadoPedido: vi.fn()
  }
}));

vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    registro: vi.fn(),
    getPerfil: vi.fn(),
    getTecnicos: vi.fn()
  }
}));

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
    getCategorias: vi.fn()
  }
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>{ui}</BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('Nuevas Funcionalidades: Registro, Toggle de Vista, Tema Claro/Oscuro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('permite alternar a la pestaña de registro y llamar a authService.registro con RolId correspondiente', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.registro).mockResolvedValueOnce({
      id_Usuario: 10,
      nombreCompleto: 'Carlos Silva',
      correo: 'csilva@bufalos.cl',
      id_Rol: 2
    });
    vi.mocked(authService.login).mockResolvedValueOnce({
      token: 'mock.token',
      usuario: {
        id_Usuario: 10,
        nombreCompleto: 'Carlos Silva',
        correo: 'csilva@bufalos.cl',
        rol: 'Tecnico',
        id_Rol: 2
      }
    });

    renderWithProviders(<LoginPage />);

    // Click en la pestaña Crear Cuenta
    const tabRegistro = screen.getByRole('button', { name: /crear cuenta/i });
    await user.click(tabRegistro);

    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rol en la plataforma/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/nombre completo/i), 'Carlos Silva');
    await user.type(screen.getByLabelText(/correo electrónico/i), 'csilva@bufalos.cl');
    await user.type(screen.getByLabelText(/contraseña/i), 'Tecnico2026!');
    await user.selectOptions(screen.getByLabelText(/rol en la plataforma/i), '2'); // Técnico

    const submitBtn = screen.getByRole('button', { name: /registrar cuenta/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(authService.registro).toHaveBeenCalledWith(
        expect.objectContaining({
          nombreCompleto: 'Carlos Silva',
          correo: 'csilva@bufalos.cl',
          password: 'Tecnico2026!',
          id_Rol: 2
        })
      );
    });
  });

  it('permite alternar entre Vista Galería (4x) y Vista Lista en el Catálogo unificado', async () => {
    const user = userEvent.setup();
    vi.mocked(categoriaService.getCategorias).mockResolvedValue([
      { id_Categoria: 1, nombre: 'Accesorios' }
    ]);
    vi.mocked(productoService.getProductos).mockResolvedValue({
      total: 1,
      pagina: 1,
      limite: 8,
      totalPaginas: 1,
      items: [
        {
          id_Producto: 42,
          nombre: 'Guantes Tácticos Reforzados',
          descripcion: 'Protección para nudillos y palmas',
          precio: 25000,
          stock: 15,
          id_Categoria: 1,
          restriccionEdad: 0,
          requierePermiso: false,
          soloPersonalAutorizado: false,
          categoria: { id_Categoria: 1, nombre: 'Accesorios' }
        }
      ]
    });

    renderWithProviders(<CatalogoPage />);

    // Esperar a que el producto aparezca en Galería
    await waitFor(() => {
      expect(screen.getByText('Guantes Tácticos Reforzados')).toBeInTheDocument();
    });

    // Botones de conmutación presentes y con textos simplificados "Galería" y "Lista"
    const btnGaleria = screen.getByRole('button', { name: /vista de cuadrícula de 4 columnas/i });
    const btnLista = screen.getByRole('button', { name: /vista de lista y tabla detallada/i });

    expect(btnGaleria).toBeInTheDocument();
    expect(btnGaleria).toHaveTextContent('Galería');
    expect(btnLista).toBeInTheDocument();
    expect(btnLista).toHaveTextContent('Lista');

    // El badge "Control Administrador" debe haber sido removido
    expect(screen.queryByText(/control administrador/i)).toBeNull();

    // Cambiar a vista Lista / Tabla
    await user.click(btnLista);

    // Debe mostrar la cabecera de la tabla
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Guantes Tácticos Reforzados')).toBeInTheDocument();
    });
  });

  it('el switch del Navbar permite alternar entre Modo Oscuro y Modo Claro', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Navbar />);

    const themeBtns = screen.getAllByRole('button', { name: /cambiar a modo claro|cambiar a modo oscuro/i });
    expect(themeBtns.length).toBeGreaterThan(0);
    const themeBtn = themeBtns[0];

    // Inicialmente data-theme es dark
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    // Cambiar a modo claro
    await user.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    // Volver a modo oscuro
    await user.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('muestra únicamente la nota más reciente por defecto en la bitácora técnica y permite expandir el historial completo', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.getTecnicos).mockResolvedValue([]);
    vi.mocked(pedidoService.getPedidos).mockResolvedValue([]);
    vi.mocked(servicioTecnicoService.getServicios).mockResolvedValue([
      {
        id: 77,
        clienteId: 5,
        tecnicoId: 2,
        descripcionProblema: 'Falla en cierre de chaleco táctico',
        estado: 'En Reparación',
        costoEstimado: 35000,
        fechaIngreso: '2026-10-18T10:00:00Z',
        seguimientos: [
          {
            id: 1,
            servicioTecnicoId: 77,
            notas: 'Nota 1: Diagnóstico inicial realizado',
            fechaRegistro: '2026-10-18T11:00:00Z'
          },
          {
            id: 2,
            servicioTecnicoId: 77,
            notas: 'Nota 2: Repuesto solicitado al almacén',
            fechaRegistro: '2026-10-19T09:00:00Z'
          },
          {
            id: 3,
            servicioTecnicoId: 77,
            notas: 'Nota 3: Instalación de cierre de alta resistencia finalizada',
            fechaRegistro: '2026-10-20T14:00:00Z'
          }
        ]
      }
    ]);

    renderWithProviders(<TecnicoPanelPage />);

    // Esperar a que el ticket aparezca
    await waitFor(() => {
      expect(screen.getByText('Ticket ST-#77')).toBeInTheDocument();
    });

    // Por defecto, muestra la nota más reciente
    expect(screen.getByText(/Nota 3: Instalación de cierre de alta resistencia finalizada/i)).toBeInTheDocument();
    expect(screen.getByText(/Nota Reciente/i)).toBeInTheDocument();

    // Las notas anteriores no deben estar visibles por defecto
    expect(screen.queryByText(/Nota 1: Diagnóstico inicial realizado/i)).not.toBeInTheDocument();

    // Debe existir el botón para ver el historial completo
    const btnExpandir = screen.getByRole('button', { name: /ver historial completo/i });
    expect(btnExpandir).toBeInTheDocument();

    // Hacer click para expandir
    await user.click(btnExpandir);

    // Ahora todas las notas deben estar presentes
    expect(screen.getByText(/Nota 1: Diagnóstico inicial realizado/i)).toBeInTheDocument();
    expect(screen.getByText(/Nota 2: Repuesto solicitado al almacén/i)).toBeInTheDocument();
    expect(screen.getByText(/Nota 3: Instalación de cierre de alta resistencia finalizada/i)).toBeInTheDocument();

    // Debe mostrar la opción para plegar
    const btnPlegar = screen.getByRole('button', { name: /plegar bitácora/i });
    expect(btnPlegar).toBeInTheDocument();

    // Hacer click para plegar nuevamente
    await user.click(btnPlegar);
    expect(screen.queryByText(/Nota 1: Diagnóstico inicial realizado/i)).not.toBeInTheDocument();
  });

  it('renderiza la imagen del producto táctico o placeholder y permite abrir el modal de imagen para el administrador', async () => {
    const adminUser = {
      id_Usuario: 1,
      nombreCompleto: 'Admin Test',
      correo: 'admin@bufalos.cl',
      rol: 'Administrador',
      id_Rol: 1
    };
    localStorage.setItem('bufalos_token', 'mock.token');
    localStorage.setItem('bufalos_user', JSON.stringify(adminUser));
    vi.mocked(authService.getPerfil).mockResolvedValue(adminUser);

    vi.mocked(categoriaService.getCategorias).mockResolvedValue([
      { id_Categoria: 1, nombre: 'Accesorios' }
    ]);
    vi.mocked(productoService.getProductos).mockResolvedValue({
      total: 1,
      pagina: 1,
      limite: 8,
      totalPaginas: 1,
      items: [
        {
          id_Producto: 99,
          nombre: 'Chaleco Antibalas Nivel IV',
          descripcion: 'Placas cerámicas multicapa',
          precio: 350000,
          stock: 5,
          id_Categoria: 1,
          restriccionEdad: 18,
          requierePermiso: true,
          soloPersonalAutorizado: true,
          imagenUrl: 'https://ejemplo.com/chaleco.jpg',
          categoria: { id_Categoria: 1, nombre: 'Accesorios' }
        }
      ]
    });

    renderWithProviders(<CatalogoPage />);

    await waitFor(() => {
      const img = screen.getByRole('img', { name: /chaleco antibalas nivel iv/i });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://ejemplo.com/chaleco.jpg');
    });

    // Como administrador, no debe mostrar el texto "Control Administrador" en la cabecera
    expect(screen.queryByText(/control administrador/i)).toBeNull();

    // Debe existir botón para gestionar imagen
    await waitFor(() => {
      const btnImagen = screen.getAllByRole('button', { name: /cambiar imagen/i });
      expect(btnImagen.length).toBeGreaterThan(0);
    });
  });
});
