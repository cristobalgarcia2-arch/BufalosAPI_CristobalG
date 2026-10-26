using System.Security.Claims;
using BufalosAPI.Data;
using BufalosAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace BufalosAPI.Endpoints
{
    public static class PedidoApi
    {
        public static void MapPedidoApi(this WebApplication app)
        {
            var pedidos = app.MapGroup("/api/v1/pedidos")
                .WithTags("Pedidos")
                .RequireAuthorization();

            // GET: Listar estados de pedido disponibles
            pedidos.MapGet("/estados", () =>
            {
                var estados = new[]
                {
                    new { id = 1, nombre = "Pendiente" },
                    new { id = 2, nombre = "Completado" },
                    new { id = 3, nombre = "Enviado" },
                    new { id = 4, nombre = "Cancelado" }
                };
                return Results.Ok(estados);
            });

            // GET: Listar pedidos (filtrados por cliente si es rol Cliente, o todos si es Admin/Técnico)
            pedidos.MapGet("/", async (
                int? usuarioId,
                int? estadoId,
                string? estado,
                ClaimsPrincipal user,
                BufalosDbContext db) =>
            {
                var rol = user.FindFirst(ClaimTypes.Role)?.Value ?? "Cliente";
                var idStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                int.TryParse(idStr, out int currentUserId);

                var query = db.Pedidos
                    .Include(p => p.Usuario)
                    .Include(p => p.Detalles)
                        .ThenInclude(d => d.Producto)
                    .AsNoTracking()
                    .AsQueryable();

                // Si es Cliente, sólo puede consultar sus propios pedidos
                if (rol == "Cliente")
                {
                    query = query.Where(p => p.UsuarioId == currentUserId);
                }
                else if (usuarioId.HasValue && usuarioId.Value > 0)
                {
                    query = query.Where(p => p.UsuarioId == usuarioId.Value);
                }

                if (!string.IsNullOrWhiteSpace(estado))
                {
                    query = query.Where(p => p.EstadoPedido == estado.Trim());
                }
                else if (estadoId.HasValue && estadoId.Value > 0)
                {
                    var nombreEstado = estadoId.Value switch
                    {
                        1 => "Pendiente",
                        2 => "Completado",
                        3 => "Enviado",
                        4 => "Cancelado",
                        _ => null
                    };
                    if (nombreEstado != null)
                    {
                        query = query.Where(p => p.EstadoPedido == nombreEstado);
                    }
                }

                var lista = await query.OrderByDescending(p => p.FechaPedido).ToListAsync();
                return Results.Ok(lista);
            });

            // GET: Detalle de un pedido por ID
            pedidos.MapGet("/{id:int}", async (int id, ClaimsPrincipal user, BufalosDbContext db) =>
            {
                var rol = user.FindFirst(ClaimTypes.Role)?.Value ?? "Cliente";
                var idStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                int.TryParse(idStr, out int currentUserId);

                var pedido = await db.Pedidos
                    .Include(p => p.Usuario)
                    .Include(p => p.Detalles)
                        .ThenInclude(d => d.Producto)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (pedido is null)
                {
                    return Results.NotFound(new { mensaje = "Pedido no encontrado." });
                }

                if (rol == "Cliente" && pedido.UsuarioId != currentUserId)
                {
                    return Results.Forbid();
                }

                return Results.Ok(pedido);
            });

            // POST: Registrar un nuevo pedido (Cliente o Admin)
            pedidos.MapPost("/", async (CrearPedidoRequest request, ClaimsPrincipal user, BufalosDbContext db) =>
            {
                if (request.Items == null || request.Items.Count == 0)
                {
                    return Results.BadRequest(new { mensaje = "El pedido debe contener al menos un producto." });
                }

                var idStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(idStr, out int currentUserId) || currentUserId <= 0)
                {
                    return Results.Unauthorized();
                }

                var usuarioActual = await db.Usuarios
                    .Include(u => u.Rol)
                    .Include(u => u.Permisos)
                    .FirstOrDefaultAsync(u => u.Id == currentUserId);

                if (usuarioActual is null)
                {
                    return Results.Unauthorized();
                }

                if (!usuarioActual.EsVerificado)
                {
                    return Results.Json(new
                    {
                        status = 403,
                        mensaje = "Su cuenta ha sido suspendida/baneada. No está autorizado para realizar pedidos."
                    }, statusCode: StatusCodes.Status403Forbidden);
                }

                var esAdmin = usuarioActual.Rol?.Nombre == "Administrador" || usuarioActual.Rol?.Nombre == "Admin";

                decimal total = 0;
                var detalles = new List<DetallePedido>();

                foreach (var item in request.Items)
                {
                    if (item.Cantidad <= 0)
                    {
                        return Results.BadRequest(new { mensaje = "La cantidad debe ser mayor a 0." });
                    }

                    var prod = await db.Productos.FindAsync(item.ProductoId);
                    if (prod is null)
                    {
                        return Results.BadRequest(new { mensaje = $"El producto con ID {item.ProductoId} no existe." });
                    }

                    // Validación de Restricción de Edad
                    if (prod.RestriccionEdad > 0 && !esAdmin)
                    {
                        int edadUsuario = 0;
                        if (usuarioActual.FechaNacimiento.HasValue)
                        {
                            var hoy = DateTime.UtcNow;
                            edadUsuario = hoy.Year - usuarioActual.FechaNacimiento.Value.Year;
                            if (usuarioActual.FechaNacimiento.Value.Date > hoy.AddYears(-edadUsuario)) edadUsuario--;
                        }

                        bool autorizacionEdad = usuarioActual.Permisos.Any(p =>
                            p.Estado == "Activo" &&
                            p.FechaExpiracion > DateTime.UtcNow &&
                            (p.TipoPermiso.Contains("Edad", StringComparison.OrdinalIgnoreCase) || p.TipoPermiso.Contains("+18")));

                        if (edadUsuario < prod.RestriccionEdad && !autorizacionEdad)
                        {
                            return Results.Json(new
                            {
                                status = 403,
                                mensaje = $"El producto '{prod.Nombre}' tiene una restricción de edad de +{prod.RestriccionEdad} años. Su cuenta no cumple con la edad requerida ni cuenta con un permiso especial activo."
                            }, statusCode: StatusCodes.Status403Forbidden);
                        }
                    }

                    // Validación de Solo Personal Autorizado
                    if (prod.SoloPersonalAutorizado && !esAdmin)
                    {
                        bool esAutorizado = usuarioActual.Permisos.Any(p =>
                            p.Estado == "Activo" &&
                            p.FechaExpiracion > DateTime.UtcNow &&
                            (p.TipoPermiso.Contains("Personal Autorizado", StringComparison.OrdinalIgnoreCase) ||
                             p.TipoPermiso.Contains("Fuerzas", StringComparison.OrdinalIgnoreCase) ||
                             p.TipoPermiso.Contains("Seguridad", StringComparison.OrdinalIgnoreCase)));

                        if (!esAutorizado)
                        {
                            return Results.Json(new
                            {
                                status = 403,
                                mensaje = $"El producto '{prod.Nombre}' es de adquisición exclusiva para Personal Autorizado (Fuerzas de Orden y Seguridad). Requiere acreditación o permiso activo en su cuenta."
                            }, statusCode: StatusCodes.Status403Forbidden);
                        }
                    }

                    // Validación de Requiere Permiso
                    if (prod.RequierePermiso && !esAdmin)
                    {
                        bool tienePermiso = usuarioActual.Permisos.Any(p =>
                            p.Estado == "Activo" &&
                            p.FechaExpiracion > DateTime.UtcNow &&
                            (p.TipoPermiso.Contains("Armas", StringComparison.OrdinalIgnoreCase) ||
                             p.TipoPermiso.Contains("Caza", StringComparison.OrdinalIgnoreCase) ||
                             p.TipoPermiso.Contains("Regulado", StringComparison.OrdinalIgnoreCase) ||
                             p.TipoPermiso.Contains("Porte", StringComparison.OrdinalIgnoreCase)));

                        if (!tienePermiso)
                        {
                            return Results.Json(new
                            {
                                status = 403,
                                mensaje = $"El producto '{prod.Nombre}' requiere un permiso especial activo (ej. Porte de Armas / Caza o Permiso Táctico Regulado)."
                            }, statusCode: StatusCodes.Status403Forbidden);
                        }
                    }

                    if (prod.Stock < item.Cantidad)
                    {
                        return Results.BadRequest(new { mensaje = $"Stock insuficiente para '{prod.Nombre}'. Stock disponible: {prod.Stock}" });
                    }

                    // Descontar stock
                    prod.Stock -= item.Cantidad;
                    var subtotal = prod.Precio * item.Cantidad;
                    total += subtotal;

                    detalles.Add(new DetallePedido
                    {
                        ProductoId = prod.Id,
                        Cantidad = item.Cantidad,
                        PrecioUnitario = prod.Precio,
                        Subtotal = subtotal
                    });
                }

                var metodoEntrega = !string.IsNullOrWhiteSpace(request.MetodoEntrega)
                    ? request.MetodoEntrega.Trim()
                    : "Despacho a Domicilio";

                var direccionEnvio = !string.IsNullOrWhiteSpace(request.DireccionEnvio)
                    ? request.DireccionEnvio.Trim()
                    : "Dirección registrada de cliente";

                var pedido = new Pedido
                {
                    UsuarioId = currentUserId,
                    EstadoPedido = "Pendiente",
                    MetodoEntrega = metodoEntrega,
                    DireccionEnvio = direccionEnvio,
                    Total = total,
                    FechaPedido = DateTime.UtcNow,
                    Detalles = detalles
                };

                db.Pedidos.Add(pedido);
                await db.SaveChangesAsync();

                // Cargar relaciones para la respuesta
                await db.Entry(pedido).Reference(p => p.Usuario).LoadAsync();

                return Results.Created($"/api/v1/pedidos/{pedido.Id}", pedido);
            });

            // PUT: Actualizar estado de pedido (Solo Admin o Técnico)
            pedidos.MapPut("/{id:int}/estado", async (int id, ActualizarEstadoPedidoRequest request, BufalosDbContext db) =>
            {
                var pedido = await db.Pedidos.FindAsync(id);
                if (pedido is null)
                {
                    return Results.NotFound(new { mensaje = "Pedido no encontrado." });
                }

                if (!string.IsNullOrWhiteSpace(request.Estado))
                {
                    pedido.EstadoPedido = request.Estado.Trim();
                }
                else if (request.EstadoId.HasValue)
                {
                    pedido.EstadoId = request.EstadoId.Value;
                }
                else
                {
                    return Results.BadRequest(new { mensaje = "Debe especificar un estadoId o estado." });
                }

                await db.SaveChangesAsync();

                return Results.Ok(new
                {
                    mensaje = "Estado del pedido actualizado exitosamente.",
                    estado = pedido.EstadoPedido,
                    estadoId = pedido.EstadoId
                });
            })
            .RequireAuthorization(policy => policy.RequireRole("Administrador", "Tecnico", "Técnico", "Admin"));
        }
    }

    public record CrearPedidoRequest(List<ItemPedidoDto> Items, string? MetodoEntrega = null, string? DireccionEnvio = null);
    public record ItemPedidoDto(int ProductoId, int Cantidad);
    public record ActualizarEstadoPedidoRequest(int? EstadoId = null, string? Estado = null);
}
