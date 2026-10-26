import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { AdminUsuariosPage } from '../pages/admin/AdminUsuariosPage';
import { ProductoDetallePage } from '../pages/ProductoDetallePage';
import { ClientePanelPage } from '../pages/cliente/ClientePanelPage';
import { usuarioService } from '../services/usuarioService';
import { productoService } from '../services/productoService';
import { servicioTecnicoService } from '../services/servicioTecnicoService';
import { pedidoService } from '../services/pedidoService';

vi.mock('../services/usuarioService', () => ({
  usuarioService: {
    getUsuarios: vi.fn(),
    cambiarEstadoUsuario: vi.fn(),
    otorgarPermiso: vi.fn(),
    revocarPermiso: vi.fn()
  }
}));

vi.mock('../services/productoService', () => ({
  productoService: {
    getProductos: vi.fn(),
    getProductoById: vi.fn(),
    getProveedores: vi.fn(),
    crearProducto: vi.fn(),
    actualizarProducto: vi.fn(),
    eliminarProducto: vi.fn()
  }
}));

vi.mock('../services/servicioTecnicoService', () => ({
  servicioTecnicoService: {
    getServicios: vi.fn(),
    getServicioById: vi.fn(),
    getTiposServicio: vi.fn(),
    crearServicio: vi.fn(),
    actualizarServicio: vi.fn(),
    agregarSeguimiento: vi.fn()
  }
}));

vi.mock('../services/pedidoService', () => ({
  pedidoService: {
    getPedidos: vi.fn(),
    crearPedido: vi.fn(),
    actualizarEstadoPedido: vi.fn()
  }
}));

const mockUsuarios = [
  {
    id_Usuario: 1,
    nombreCompleto: 'Goberto Parra',
    correo: 'admin@bufalos.cl',
    id_Rol: 1,
    rol: 'Administrador',
    esVerificado: true,
    fechaNacimiento: '1990-05-12T00:00:00Z',
    fechaCreacion: '2026-09-01T00:00:00Z',
    permisos: []
  },
  {
    id_Usuario: 3,
    nombreCompleto: 'Cristóbal García',
    correo: 'cliente@gmail.com',
    id_Rol: 3,
    rol: 'Cliente',
    esVerificado: true,
    fechaNacimiento: '2000-02-15T00:00:00Z',
    fechaCreacion: '2026-09-10T00:00:00Z',
    permisos: [
      {
        id_Permiso: 1,
        id_Usuario: 3,
        tipoPermiso: 'Porte de Armas / Caza',
        numeroDocumento: 'LIC-98765432',
        fechaExpiracion: '2028-12-31T00:00:00Z',
        estado: 'Activo'
      }
    ]
  },
  {
    id_Usuario: 4,
    nombreCompleto: 'Usuario Baneado',
    correo: 'baneado@gmail.com',
    id_Rol: 3,
    rol: 'Cliente',
    esVerificado: false,
    fechaNacimiento: '1998-07-20T00:00:00Z',
    fechaCreacion: '2026-09-15T00:00:00Z',
    permisos: []
  }
];

const mockProductoConProveedores = {
  id_Producto: 1,
  nombre: 'Casco Táctico Kevlar IIIA',
  descripcion: 'Casco balístico de alta resistencia',
  precio: 145990,
  stock: 15,
  id_Categoria: 1,
  restriccionEdad: 18,
  requierePermiso: false,
  soloPersonalAutorizado: false,
  numeroSerie: 'CASCO-KV-001',
  categoria: { id_Categoria: 1, nombre: 'Equipamiento Táctico' },
  proveedores: [
    {
      id_Proveedor: 1,
      nombreEmpresa: 'Tactical Gear SpA',
      contacto: 'Carlos Mendez',
      telefono: '+56912345678',
      correo: 'contacto@tacticalgear.cl'
    }
  ]
};

const mockServiciosCliente = [
  {
    id: 1,
    clienteId: 3,
    tecnicoId: 2,
    tipoServicioId: 1,
    descripcionProblema: '[Personalización de Parches] Parche bordado con tipo de sangre',
    estado: 'En Revisión',
    costoEstimado: 4990,
    fechaIngreso: '2026-10-15T12:00:00Z',
    tipoServicio: {
      id_TipoServicio: 1,
      nombre: 'Personalización de Parches',
      costoBase: 4990,
      tiempoEstimadoDias: 2
    },
    tecnico: {
      id_Usuario: 2,
      nombreCompleto: 'Ignacio Molina',
      nombre: 'Ignacio',
      apellido: 'Molina',
      correo: 'tecnico@bufalos.cl',
      rol: 'Tecnico',
      id_Rol: 2
    },
    seguimientos: [
      {
        id: 1,
        servicioTecnicoId: 1,
        notas: 'Diseño digital aprobado en formato de hilo gris reflectante.',
        fechaRegistro: '2026-10-15T14:30:00Z',
        textoPersonalizado: 'OPE-BÚFALO / A+',
        dimensiones: '7x5 cm',
        tipoBordado: 'Alta Definición con Velcro',
        cantidad: 2
      },
      {
        id: 2,
        servicioTecnicoId: 1,
        notas: 'En proceso de bordado y costura de velcro posterior.',
        fechaRegistro: '2026-10-16T10:00:00Z'
      }
    ]
  }
];

const renderComponent = (ui: React.ReactElement, initialEntries = ['/']) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('Requerimientos Trabajo 2: Gestión de Usuarios, Permisos, Proveedores e Historial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(
      'bufalos_user',
      JSON.stringify({
        id_Usuario: 1,
        nombreCompleto: 'Goberto Parra',
        correo: 'admin@bufalos.cl',
        rol: 'Administrador',
        id_Rol: 1
      })
    );
    localStorage.setItem('bufalos_token', 'mock.admin.jwt.token');
  });

  it('AdminUsuariosPage: visualiza listado completo de usuarios, roles y estado de baneo', async () => {
    vi.mocked(usuarioService.getUsuarios).mockResolvedValue(mockUsuarios);

    renderComponent(<AdminUsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText('Gestión de Usuarios y Permisos Especiales')).toBeInTheDocument();
      expect(screen.getByText('Goberto Parra')).toBeInTheDocument();
      expect(screen.getByText('Cristóbal García')).toBeInTheDocument();
      expect(screen.getByText('Usuario Baneado')).toBeInTheDocument();
    });

    expect(screen.getByText('Baneado / Suspendido')).toBeInTheDocument();
    expect(screen.getByText('Porte de Armas / Caza')).toBeInTheDocument();
  });

  it('AdminUsuariosPage: permite banear o reactivar cuenta de usuario llamando al servicio', async () => {
    const user = userEvent.setup();
    vi.mocked(usuarioService.getUsuarios).mockResolvedValue(mockUsuarios);
    vi.mocked(usuarioService.cambiarEstadoUsuario).mockResolvedValue({
      mensaje: 'Cuenta suspendida/baneada con éxito.',
      id_Usuario: 3,
      esVerificado: false
    });

    // Mock confirm para aceptar suspensión
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    renderComponent(<AdminUsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText('Cristóbal García')).toBeInTheDocument();
    });

    const cristobalCard = screen.getByText('Cristóbal García').closest('div.border.rounded-2xl');
    expect(cristobalCard).not.toBeNull();

    const banBtn = within(cristobalCard as HTMLElement).getByRole('button', { name: /banear \/ desactivar/i });
    await user.click(banBtn);

    expect(usuarioService.cambiarEstadoUsuario).toHaveBeenCalledWith(3, false);
  });

  it('AdminUsuariosPage: abre modal y permite otorgar permiso especial a un usuario', async () => {
    const user = userEvent.setup();
    vi.mocked(usuarioService.getUsuarios).mockResolvedValue(mockUsuarios);
    vi.mocked(usuarioService.otorgarPermiso).mockResolvedValue({
      id_Permiso: 99,
      id_Usuario: 3,
      tipoPermiso: 'Personal Autorizado (Fuerzas de Orden / Seguridad)',
      numeroDocumento: 'DOC-123456',
      fechaExpiracion: '2027-10-21T00:00:00Z',
      estado: 'Activo'
    });

    renderComponent(<AdminUsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText('Cristóbal García')).toBeInTheDocument();
    });

    const cristobalCard = screen.getByText('Cristóbal García').closest('div.border.rounded-2xl');
    const otorgarBtn = within(cristobalCard as HTMLElement).getByRole('button', { name: /otorgar permiso/i });
    await user.click(otorgarBtn);

    await waitFor(() => {
      expect(screen.getByText(/Otorgar Permiso Especial a Cristóbal García/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /conceder permiso especial/i });
    await user.click(submitBtn);

    expect(usuarioService.otorgarPermiso).toHaveBeenCalled();
  });

  it('ProductoDetallePage: muestra proveedores oficiales asociados en la ficha del producto', async () => {
    vi.mocked(productoService.getProductoById).mockResolvedValueOnce(mockProductoConProveedores);

    renderComponent(
      <Routes>
        <Route path="/productos/:id" element={<ProductoDetallePage />} />
      </Routes>,
      ['/productos/1']
    );

    await waitFor(() => {
      expect(screen.getByText('Casco Táctico Kevlar IIIA')).toBeInTheDocument();
      expect(screen.getByText('Cadena de Suministro y Proveedores Oficiales')).toBeInTheDocument();
      expect(screen.getByText('Tactical Gear SpA')).toBeInTheDocument();
      expect(screen.getByText(/Carlos Mendez/i)).toBeInTheDocument();
      expect(screen.getByText('+56912345678')).toBeInTheDocument();
      expect(screen.getByText('contacto@tacticalgear.cl')).toBeInTheDocument();
    });
  });

  it('ClientePanelPage: sincroniza vista de servicios con historial de bitácora y detalles de parches custom', async () => {
    vi.mocked(servicioTecnicoService.getServicios).mockResolvedValueOnce(mockServiciosCliente);
    vi.mocked(servicioTecnicoService.getTiposServicio).mockResolvedValueOnce([
      {
        id_TipoServicio: 1,
        nombre: 'Personalización de Parches',
        costoBase: 4990,
        tiempoEstimadoDias: 2
      }
    ]);
    vi.mocked(pedidoService.getPedidos).mockResolvedValueOnce([]);

    renderComponent(
      <Routes>
        <Route path="/cliente" element={<ClientePanelPage />} />
      </Routes>,
      ['/cliente?tab=servicios']
    );

    await waitFor(() => {
      expect(screen.getByText('Ticket ST-#1')).toBeInTheDocument();
      expect(screen.getByText('Personalización de Parches')).toBeInTheDocument();
      expect(screen.getByText(/OPE-BÚFALO \/ A\+/i)).toBeInTheDocument();
      expect(screen.getByText(/Alta Definición con Velcro/i)).toBeInTheDocument();
      expect(screen.getByText('Bitácora y Notas Registradas (2)')).toBeInTheDocument();
      expect(screen.getByText(/Ver historial completo/i)).toBeInTheDocument();
    });
  });
});
