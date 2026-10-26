// Tipos alineados con el esquema relacional Bufalos_DB (SQL Server) y contratos de la API

export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string | null;
  fechaCreacion?: string;
}

export interface Categoria {
  id?: number;
  id_Categoria: number;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
}

export interface Proveedor {
  id?: number;
  id_Proveedor: number;
  nombreEmpresa: string;
  contacto?: string | null;
  telefono?: string | null;
  correo?: string | null;
}

export interface Producto {
  id?: number;
  id_Producto: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  categoriaId?: number;
  id_Categoria: number;
  activo?: boolean;
  fechaCreacion?: string;
  restriccionEdad: number;
  requierePermiso: boolean;
  soloPersonalAutorizado: boolean;
  numeroSerie?: string | null;
  imagenUrl?: string | null;
  categoria?: Categoria | null;
  proveedores?: Proveedor[];
  proveedorIds?: number[];
}

export interface ProductosPaginadosResponse {
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
  items: Producto[];
}

export interface PermisoUsuario {
  id?: number;
  id_Permiso: number;
  id_Usuario: number;
  tipoPermiso: string;
  numeroDocumento: string;
  fechaExpiracion: string;
  estado: string;
}

export interface Usuario {
  id?: number;
  id_Usuario: number;
  nombre?: string;
  apellido?: string;
  nombreCompleto: string;
  correo: string;
  email?: string;
  rol: string;
  id_Rol: number;
  rolId?: number;
  activo?: boolean;
  esVerificado?: boolean;
  fechaNacimiento?: string;
  fechaCreacion?: string;
  permisos?: PermisoUsuario[];
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

export interface LoginCredentials {
  correo: string;
  password: string;
}

export interface RegistroCredentials {
  nombreCompleto: string;
  correo: string;
  password: string;
  id_Rol: number;
  fechaNacimiento?: string;
  esVerificado?: boolean;
}

export interface EstadoPedido {
  id: number;
  nombre: string;
}

export interface DetallePedido {
  id: number;
  pedidoId: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  producto?: Producto | null;
}

export interface Factura {
  id: number;
  pedidoId: number;
  numeroFactura: string;
  montoTotal: number;
  fechaEmision: string;
}

export interface Pedido {
  id: number;
  usuarioId: number;
  estadoId: number;
  estadoPedido?: string;
  metodoEntrega?: string;
  direccionEnvio?: string;
  total: number;
  fechaPedido: string;
  estado?: EstadoPedido | null;
  detalles?: DetallePedido[];
  factura?: Factura | null;
  usuario?: Usuario | null;
}

export interface CrearPedidoItem {
  productoId: number;
  cantidad: number;
}

export interface CrearPedidoRequest {
  items: CrearPedidoItem[];
  metodoEntrega?: string;
  direccionEnvio?: string;
}

export interface TipoServicio {
  id?: number;
  id_TipoServicio: number;
  nombre: string;
  costoBase: number;
  tiempoEstimadoDias: number;
}

export interface ServicioTecnicoSeguimiento {
  id: number;
  servicioTecnicoId: number;
  notas: string;
  fechaRegistro: string;
  textoPersonalizado?: string | null;
  dimensiones?: string | null;
  tipoBordado?: string | null;
  cantidad?: number;
  observacionesDiseno?: string | null;
}

export interface ServicioTecnico {
  id: number;
  clienteId: number;
  tecnicoId?: number | null;
  tipoServicioId?: number;
  descripcionProblema: string;
  estado: string;
  costoEstimado: number;
  fechaIngreso: string;
  fechaEstimadaEntrega?: string | null;
  cliente?: Usuario | null;
  tecnico?: Usuario | null;
  tipoServicio?: TipoServicio | null;
  seguimientos?: ServicioTecnicoSeguimiento[];
}

export interface CrearServicioRequest {
  descripcionProblema: string;
  costoEstimado?: number;
  tipoServicioId?: number;
  textoPersonalizado?: string;
  dimensiones?: string;
  tipoBordado?: string;
  cantidad?: number;
  observacionesDiseno?: string;
}

export interface ActualizarServicioRequest {
  estado?: string;
  tecnicoId?: number;
  costoEstimado?: number;
}

export interface AgregarSeguimientoRequest {
  notas: string;
  textoPersonalizado?: string;
  dimensiones?: string;
  tipoBordado?: string;
  cantidad?: number;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string>;
}
