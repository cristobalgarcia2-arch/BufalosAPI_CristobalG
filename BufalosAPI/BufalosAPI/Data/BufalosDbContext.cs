using BufalosAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace BufalosAPI.Data
{
    public class BufalosDbContext : DbContext
    {
        public BufalosDbContext(DbContextOptions<BufalosDbContext> options) : base(options) { }

        public DbSet<Rol> Roles { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Categoria> Categorias { get; set; }
        public DbSet<Producto> Productos { get; set; }
        public DbSet<Proveedor> Proveedores { get; set; }
        public DbSet<PermisoUsuario> PermisosUsuarios { get; set; }
        public DbSet<TipoServicio> TiposServicio { get; set; }
        public DbSet<Pedido> Pedidos { get; set; }
        public DbSet<DetallePedido> DetallePedidos { get; set; }
        public DbSet<ServicioTecnico> ServiciosTecnicos { get; set; }
        public DbSet<ServicioTecnicoSeguimiento> ServicioTecnicoSeguimientos { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Mapeo Roles -> TB_Roles
            modelBuilder.Entity<Rol>(e =>
            {
                e.ToTable("TB_Roles");
                e.HasKey(r => r.Id);
                e.Property(r => r.Id).HasColumnName("Id_Rol");
                e.Property(r => r.Nombre).HasColumnName("Nombre");
                e.Ignore(r => r.Descripcion);
                e.Ignore(r => r.FechaCreacion);
            });

            // Mapeo Categorias -> TB_Categorias
            modelBuilder.Entity<Categoria>(e =>
            {
                e.ToTable("TB_Categorias");
                e.HasKey(c => c.Id);
                e.Property(c => c.Id).HasColumnName("Id_Categoria");
                e.Property(c => c.Nombre).HasColumnName("Nombre");
                e.Ignore(c => c.Descripcion);
                e.Ignore(c => c.Activo);
            });

            // Mapeo Productos -> TB_Productos
            modelBuilder.Entity<Producto>(e =>
            {
                e.ToTable("TB_Productos");
                e.HasKey(p => p.Id);
                e.Property(p => p.Id).HasColumnName("Id_Producto");
                e.Property(p => p.Nombre).HasColumnName("Nombre");
                e.Property(p => p.Descripcion).HasColumnName("Descripcion").HasColumnType("nvarchar(max)");
                e.Property(p => p.Precio).HasColumnName("Precio").HasColumnType("decimal(10,2)");
                e.Property(p => p.Stock).HasColumnName("Stock");
                e.Property(p => p.CategoriaId).HasColumnName("Id_Categoria");
                e.Property(p => p.RestriccionEdad).HasColumnName("RestriccionEdad");
                e.Property(p => p.RequierePermiso).HasColumnName("RequierePermiso");
                e.Property(p => p.SoloPersonalAutorizado).HasColumnName("SoloPersonalAutorizado");
                e.Property(p => p.NumeroSerie).HasColumnName("NumeroSerie");
                e.Ignore(p => p.Activo);
                e.Ignore(p => p.FechaCreacion);
                e.Ignore(p => p.ImagenUrl);

                e.HasOne(p => p.Categoria).WithMany().HasForeignKey(p => p.CategoriaId);

                e.HasMany(p => p.Proveedores)
                 .WithMany(pr => pr.Productos)
                 .UsingEntity<Dictionary<string, object>>(
                     "TB_ProveedoresProductos",
                     r => r.HasOne<Proveedor>().WithMany().HasForeignKey("Id_Proveedor"),
                     l => l.HasOne<Producto>().WithMany().HasForeignKey("Id_Producto")
                 );
            });

            // Mapeo Proveedores -> TB_Proveedores
            modelBuilder.Entity<Proveedor>(e =>
            {
                e.ToTable("TB_Proveedores");
                e.HasKey(pr => pr.Id);
                e.Property(pr => pr.Id).HasColumnName("Id_Proveedor");
                e.Property(pr => pr.NombreEmpresa).HasColumnName("NombreEmpresa");
                e.Property(pr => pr.Contacto).HasColumnName("Contacto");
                e.Property(pr => pr.Telefono).HasColumnName("Telefono");
                e.Property(pr => pr.Correo).HasColumnName("Correo");
            });

            // Mapeo PermisosUsuarios -> TB_PermisosUsuarios
            modelBuilder.Entity<PermisoUsuario>(e =>
            {
                e.ToTable("TB_PermisosUsuarios");
                e.HasKey(p => p.Id);
                e.Property(p => p.Id).HasColumnName("Id_Permiso");
                e.Property(p => p.UsuarioId).HasColumnName("Id_Usuario");
                e.Property(p => p.TipoPermiso).HasColumnName("TipoPermiso");
                e.Property(p => p.NumeroDocumento).HasColumnName("NumeroDocumento");
                e.Property(p => p.FechaExpiracion).HasColumnName("FechaExpiracion");
                e.Property(p => p.Estado).HasColumnName("Estado");

                e.HasOne(p => p.Usuario)
                 .WithMany(u => u.Permisos)
                 .HasForeignKey(p => p.UsuarioId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // Mapeo TiposServicio -> TB_TiposServicio
            modelBuilder.Entity<TipoServicio>(e =>
            {
                e.ToTable("TB_TiposServicio");
                e.HasKey(t => t.Id);
                e.Property(t => t.Id).HasColumnName("Id_TipoServicio");
                e.Property(t => t.Nombre).HasColumnName("Nombre");
                e.Property(t => t.CostoBase).HasColumnName("CostoBase").HasColumnType("decimal(10,2)");
                e.Property(t => t.TiempoEstimadoDias).HasColumnName("TiempoEstimadoDias");
            });

            // Mapeo Usuarios -> TB_Usuarios
            modelBuilder.Entity<Usuario>(e =>
            {
                e.ToTable("TB_Usuarios");
                e.HasKey(u => u.Id);
                e.Property(u => u.Id).HasColumnName("Id_Usuario");
                e.Property(u => u.NombreCompleto).HasColumnName("NombreCompleto");
                e.Property(u => u.Correo).HasColumnName("Correo");
                e.Property(u => u.ContrasenaHash).HasColumnName("ContrasenaHash");
                e.Property(u => u.Id_Rol).HasColumnName("Id_Rol");
                e.Property(u => u.FechaNacimiento).HasColumnName("FechaNacimiento");
                e.Property(u => u.EsVerificado).HasColumnName("EsVerificado");
                e.Property(u => u.FechaCreacion).HasColumnName("FechaCreacion");

                e.Ignore(u => u.RolId);
                e.Ignore(u => u.Email);
                e.Ignore(u => u.PasswordHash);
                e.Ignore(u => u.Activo);
                e.Ignore(u => u.Nombre);
                e.Ignore(u => u.Apellido);

                e.HasOne(u => u.Rol).WithMany().HasForeignKey(u => u.Id_Rol);
            });

            // Mapeo Pedidos -> TB_Pedidos
            modelBuilder.Entity<Pedido>(e =>
            {
                e.ToTable("TB_Pedidos");
                e.HasKey(p => p.Id);
                e.Property(p => p.Id).HasColumnName("Id_Pedido");
                e.Property(p => p.UsuarioId).HasColumnName("Id_Usuario");
                e.Property(p => p.FechaPedido).HasColumnName("FechaPedido");
                e.Property(p => p.EstadoPedido).HasColumnName("EstadoPedido");
                e.Property(p => p.MetodoEntrega).HasColumnName("MetodoEntrega");
                e.Property(p => p.DireccionEnvio).HasColumnName("DireccionEnvio");
                e.Property(p => p.Total).HasColumnName("Total").HasColumnType("decimal(10,2)");

                e.Ignore(p => p.EstadoId);
                e.Ignore(p => p.Estado);
                e.Ignore(p => p.Factura);

                e.HasOne(p => p.Usuario)
                 .WithMany()
                 .HasForeignKey(p => p.UsuarioId);

                e.HasMany(p => p.Detalles)
                 .WithOne(d => d.Pedido)
                 .HasForeignKey(d => d.PedidoId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // Mapeo DetallePedido -> TB_DetallePedidos
            modelBuilder.Entity<DetallePedido>(e =>
            {
                e.ToTable("TB_DetallePedidos");
                e.HasKey(d => d.Id);
                e.Property(d => d.Id).HasColumnName("Id_DetallePedido");
                e.Property(d => d.PedidoId).HasColumnName("Id_Pedido");
                e.Property(d => d.ProductoId).HasColumnName("Id_Producto");
                e.Property(d => d.Cantidad).HasColumnName("Cantidad");
                e.Property(d => d.PrecioUnitario).HasColumnName("PrecioUnitario").HasColumnType("decimal(10,2)");

                e.Ignore(d => d.Subtotal);

                e.HasOne(d => d.Producto)
                 .WithMany()
                 .HasForeignKey(d => d.ProductoId);
            });

            // Mapeo ServiciosTecnicos -> TB_OrdenesServicio
            modelBuilder.Entity<ServicioTecnico>(e =>
            {
                e.ToTable("TB_OrdenesServicio");
                e.HasKey(s => s.Id);
                e.Property(s => s.Id).HasColumnName("Id_OrdenServicio");
                e.Property(s => s.ClienteId).HasColumnName("Id_Cliente");
                e.Property(s => s.TecnicoId).HasColumnName("Id_TecnicoAsignado");
                e.Property(s => s.TipoServicioId).HasColumnName("Id_TipoServicio");
                e.Property(s => s.FechaIngreso).HasColumnName("FechaIngreso");
                e.Property(s => s.FechaEstimadaEntrega).HasColumnName("FechaEstimadaEntrega");
                e.Property(s => s.Estado).HasColumnName("Estado");
                e.Property(s => s.DescripcionProblema).HasColumnName("DescripcionProblemaOriginal");
                e.Property(s => s.CostoEstimado).HasColumnName("CostoTotal").HasColumnType("decimal(10,2)");

                e.HasOne(s => s.Cliente)
                 .WithMany()
                 .HasForeignKey(s => s.ClienteId)
                 .OnDelete(DeleteBehavior.Restrict);

                e.HasOne(s => s.Tecnico)
                 .WithMany()
                 .HasForeignKey(s => s.TecnicoId)
                 .OnDelete(DeleteBehavior.Restrict);

                e.HasOne(s => s.TipoServicio)
                 .WithMany()
                 .HasForeignKey(s => s.TipoServicioId)
                 .OnDelete(DeleteBehavior.Restrict);

                e.HasMany(s => s.Seguimientos)
                 .WithOne(st => st.ServicioTecnico)
                 .HasForeignKey(st => st.ServicioTecnicoId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // Mapeo ServicioTecnicoSeguimiento -> TB_DetallesParchesCustom
            modelBuilder.Entity<ServicioTecnicoSeguimiento>(e =>
            {
                e.ToTable("TB_DetallesParchesCustom");
                e.HasKey(st => st.Id);
                e.Property(st => st.Id).HasColumnName("Id_DetalleParche");
                e.Property(st => st.ServicioTecnicoId).HasColumnName("Id_OrdenServicio");
                e.Property(st => st.TextoPersonalizado).HasColumnName("TextoPersonalizado");
                e.Property(st => st.Dimensiones).HasColumnName("Dimensiones");
                e.Property(st => st.TipoBordado).HasColumnName("TipoBordado");
                e.Property(st => st.Cantidad).HasColumnName("Cantidad");
                e.Property(st => st.Notas).HasColumnName("ObservacionesDiseno");

                e.Ignore(st => st.FechaRegistro);
                e.Ignore(st => st.ObservacionesDiseno);
            });
        }
    }
}