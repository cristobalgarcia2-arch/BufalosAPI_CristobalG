using BufalosAPI.Data;
using BufalosAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace BufalosAPI.Endpoints
{
    public static class ProductoApi
    {
        public static void MapProductoApi(this WebApplication app)
        {
            var productos = app.MapGroup("/api/v1/productos").WithTags("Productos");

            // GET: Consultar productos con soporte de búsqueda, filtro por categoría, rango de precio, stock y paginación
            productos.MapGet("/", async (
                string? buscar,
                int? idCategoria,
                decimal? precioMin,
                decimal? precioMax,
                bool? soloConStock,
                int? pagina,
                int? limite,
                BufalosDbContext db) =>
            {
                var query = db.Productos
                    .Include(p => p.Categoria)
                    .Include(p => p.Proveedores)
                    .AsNoTracking()
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(buscar))
                {
                    var term = buscar.Trim();
                    query = query.Where(p => EF.Functions.Like(p.Nombre, $"%{term}%") ||
                                            (p.Descripcion != null && EF.Functions.Like(p.Descripcion, $"%{term}%")));
                }

                if (idCategoria.HasValue && idCategoria.Value > 0)
                {
                    query = query.Where(p => p.CategoriaId == idCategoria.Value);
                }

                if (precioMin.HasValue && precioMin.Value >= 0)
                {
                    query = query.Where(p => p.Precio >= precioMin.Value);
                }

                if (precioMax.HasValue && precioMax.Value > 0)
                {
                    query = query.Where(p => p.Precio <= precioMax.Value);
                }

                if (soloConStock.HasValue && soloConStock.Value)
                {
                    query = query.Where(p => p.Stock > 0);
                }

                var total = await query.CountAsync();

                // Si se solicita paginación
                if (pagina.HasValue && pagina.Value > 0)
                {
                    var pageSize = limite.GetValueOrDefault(10);
                    if (pageSize <= 0) pageSize = 10;
                    if (pageSize > 100) pageSize = 100;

                    var currentPage = pagina.Value;
                    var items = await query
                        .OrderBy(p => p.Id)
                        .Skip((currentPage - 1) * pageSize)
                        .Take(pageSize)
                        .ToListAsync();

                    return Results.Ok(new
                    {
                        total,
                        pagina = currentPage,
                        limite = pageSize,
                        totalPaginas = (int)Math.Ceiling((double)total / pageSize),
                        items
                    });
                }

                // Sin paginación explícita: retorna listado completo para compatibilidad
                var todos = await query.OrderBy(p => p.Id).ToListAsync();
                return Results.Ok(new
                {
                    total,
                    pagina = 1,
                    limite = total,
                    totalPaginas = 1,
                    items = todos
                });
            });

            // GET: Producto por ID
            productos.MapGet("/{id:int}", async (int id, BufalosDbContext db) =>
            {
                var producto = await db.Productos
                    .Include(p => p.Categoria)
                    .Include(p => p.Proveedores)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Id == id);

                return producto is not null
                    ? Results.Ok(producto)
                    : Results.NotFound(new { mensaje = "Producto no encontrado." });
            });

            // GET: Listar todos los proveedores
            var proveedoresGroup = app.MapGroup("/api/v1/proveedores").WithTags("Proveedores");

            proveedoresGroup.MapGet("/", async (BufalosDbContext db) =>
            {
                var lista = await db.Proveedores.AsNoTracking().OrderBy(pr => pr.NombreEmpresa).ToListAsync();
                return Results.Ok(lista);
            });

            // POST: Registrar nuevo proveedor (Administrador)
            proveedoresGroup.MapPost("/", async (ProveedorDto dto, BufalosDbContext db) =>
            {
                if (string.IsNullOrWhiteSpace(dto.NombreEmpresa))
                {
                    return Results.BadRequest(new { mensaje = "El nombre de la empresa proveedora es obligatorio." });
                }

                var prov = new Proveedor
                {
                    NombreEmpresa = dto.NombreEmpresa.Trim(),
                    Contacto = dto.Contacto?.Trim(),
                    Telefono = dto.Telefono?.Trim(),
                    Correo = dto.Correo?.Trim()
                };

                db.Proveedores.Add(prov);
                await db.SaveChangesAsync();

                return Results.Created($"/api/v1/proveedores/{prov.Id}", prov);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Admin"));

            // PUT: Actualizar proveedor (Administrador)
            proveedoresGroup.MapPut("/{id:int}", async (int id, ProveedorDto dto, BufalosDbContext db) =>
            {
                var prov = await db.Proveedores.FindAsync(id);
                if (prov is null)
                {
                    return Results.NotFound(new { mensaje = "Proveedor no encontrado." });
                }

                if (string.IsNullOrWhiteSpace(dto.NombreEmpresa))
                {
                    return Results.BadRequest(new { mensaje = "El nombre de la empresa proveedora es obligatorio." });
                }

                prov.NombreEmpresa = dto.NombreEmpresa.Trim();
                prov.Contacto = dto.Contacto?.Trim();
                prov.Telefono = dto.Telefono?.Trim();
                prov.Correo = dto.Correo?.Trim();

                await db.SaveChangesAsync();
                return Results.Ok(prov);
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Admin"));

            // DELETE: Eliminar proveedor (Administrador)
            proveedoresGroup.MapDelete("/{id:int}", async (int id, BufalosDbContext db) =>
            {
                var prov = await db.Proveedores.FindAsync(id);
                if (prov is null)
                {
                    return Results.NotFound(new { mensaje = "Proveedor no encontrado." });
                }

                db.Proveedores.Remove(prov);
                await db.SaveChangesAsync();
                return Results.Ok(new { mensaje = "Proveedor eliminado exitosamente." });
            }).RequireAuthorization(policy => policy.RequireRole("Administrador", "Admin"));

            // POST: Crear producto (requiere rol de Administrador)
            productos.MapPost("/", async (ProductoDto dto, BufalosDbContext db) =>
            {
                var errors = ValidarProducto(dto);
                if (errors.Count > 0)
                {
                    return Results.BadRequest(new { mensaje = "Errores de validación.", errors });
                }

                var categoriaExiste = await db.Categorias.AnyAsync(c => c.Id == dto.Id_Categoria);
                if (!categoriaExiste)
                {
                    return Results.BadRequest(new { mensaje = "La categoría indicada no existe." });
                }

                var producto = new Producto
                {
                    Nombre = dto.Nombre.Trim(),
                    Descripcion = dto.Descripcion?.Trim(),
                    Precio = dto.Precio,
                    Stock = dto.Stock,
                    CategoriaId = dto.Id_Categoria,
                    RestriccionEdad = dto.RestriccionEdad,
                    RequierePermiso = dto.RequierePermiso,
                    SoloPersonalAutorizado = dto.SoloPersonalAutorizado,
                    NumeroSerie = dto.NumeroSerie?.Trim(),
                    Activo = true,
                    FechaCreacion = DateTime.UtcNow
                };

                if (dto.ProveedorIds != null && dto.ProveedorIds.Count > 0)
                {
                    var proveedores = await db.Proveedores.Where(pr => dto.ProveedorIds.Contains(pr.Id)).ToListAsync();
                    producto.Proveedores = proveedores;
                }

                db.Productos.Add(producto);
                await db.SaveChangesAsync();

                await db.Entry(producto).Reference(p => p.Categoria).LoadAsync();
                await db.Entry(producto).Collection(p => p.Proveedores).LoadAsync();

                return Results.Created($"/api/v1/productos/{producto.Id}", producto);
            })
            .RequireAuthorization(policy => policy.RequireRole("Administrador"));

            // PUT: Actualizar producto existente (requiere rol de Administrador)
            productos.MapPut("/{id:int}", async (int id, ProductoDto dto, BufalosDbContext db) =>
            {
                var producto = await db.Productos.Include(p => p.Proveedores).FirstOrDefaultAsync(p => p.Id == id);
                if (producto is null)
                {
                    return Results.NotFound(new { mensaje = "Producto no encontrado para actualizar." });
                }

                var errors = ValidarProducto(dto);
                if (errors.Count > 0)
                {
                    return Results.BadRequest(new { mensaje = "Errores de validación.", errors });
                }

                var categoriaExiste = await db.Categorias.AnyAsync(c => c.Id == dto.Id_Categoria);
                if (!categoriaExiste)
                {
                    return Results.BadRequest(new { mensaje = "La categoría indicada no existe." });
                }

                producto.Nombre = dto.Nombre.Trim();
                producto.Descripcion = dto.Descripcion?.Trim();
                producto.Precio = dto.Precio;
                producto.Stock = dto.Stock;
                producto.CategoriaId = dto.Id_Categoria;
                producto.RestriccionEdad = dto.RestriccionEdad;
                producto.RequierePermiso = dto.RequierePermiso;
                producto.SoloPersonalAutorizado = dto.SoloPersonalAutorizado;
                producto.NumeroSerie = dto.NumeroSerie?.Trim();

                if (dto.ProveedorIds != null)
                {
                    producto.Proveedores.Clear();
                    if (dto.ProveedorIds.Count > 0)
                    {
                        var proveedores = await db.Proveedores.Where(pr => dto.ProveedorIds.Contains(pr.Id)).ToListAsync();
                        foreach (var pr in proveedores)
                        {
                            producto.Proveedores.Add(pr);
                        }
                    }
                }

                await db.SaveChangesAsync();
                await db.Entry(producto).Reference(p => p.Categoria).LoadAsync();

                return Results.Ok(producto);
            })
            .RequireAuthorization(policy => policy.RequireRole("Administrador"));

            // DELETE: Eliminar producto (requiere rol de Administrador)
            productos.MapDelete("/{id:int}", async (int id, BufalosDbContext db) =>
            {
                var producto = await db.Productos.FindAsync(id);
                if (producto is null)
                {
                    return Results.NotFound(new { mensaje = "Producto no encontrado para eliminar." });
                }

                db.Productos.Remove(producto);
                await db.SaveChangesAsync();

                return Results.Ok(new { mensaje = "Producto eliminado con éxito." });
            })
            .RequireAuthorization(policy => policy.RequireRole("Administrador"));
        }

        private static Dictionary<string, string> ValidarProducto(ProductoDto dto)
        {
            var errors = new Dictionary<string, string>();

            if (string.IsNullOrWhiteSpace(dto.Nombre))
            {
                errors["nombre"] = "El nombre del producto es obligatorio.";
            }
            else if (dto.Nombre.Length > 150)
            {
                errors["nombre"] = "El nombre no puede superar los 150 caracteres.";
            }

            if (dto.Precio <= 0)
            {
                errors["precio"] = "El precio debe ser un número positivo mayor a 0.";
            }

            if (dto.Stock < 0)
            {
                errors["stock"] = "El stock no puede ser negativo.";
            }

            if (dto.Id_Categoria <= 0)
            {
                errors["id_Categoria"] = "Debe seleccionar una categoría válida.";
            }

            if (dto.RestriccionEdad < 0 || dto.RestriccionEdad > 99)
            {
                errors["restriccionEdad"] = "La restricción de edad debe estar entre 0 y 99 años.";
            }

            return errors;
        }

        public record ProveedorDto(
            string NombreEmpresa,
            string? Contacto,
            string? Telefono,
            string? Correo
        );

        public record ProductoDto(
            string Nombre,
            string? Descripcion,
            decimal Precio,
            int Stock,
            int Id_Categoria,
            int RestriccionEdad,
            bool RequierePermiso,
            bool SoloPersonalAutorizado,
            string? NumeroSerie,
            List<int>? ProveedorIds = null,
            string? ImagenUrl = null
        );
    }
}