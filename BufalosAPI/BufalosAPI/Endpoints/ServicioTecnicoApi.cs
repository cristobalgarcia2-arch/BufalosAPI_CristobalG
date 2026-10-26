using System.Security.Claims;
using BufalosAPI.Data;
using BufalosAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace BufalosAPI.Endpoints
{
    public static class ServicioTecnicoApi
    {
        public static void MapServicioTecnicoApi(this WebApplication app)
        {
            var servicios = app.MapGroup("/api/v1/servicios-tecnicos")
                .WithTags("Servicios Técnicos")
                .RequireAuthorization();

            // GET: Listar servicios técnicos (Cliente ve los suyos; Técnico y Admin ven todos)
            servicios.MapGet("/", async (
                string? estado,
                int? tecnicoId,
                ClaimsPrincipal user,
                BufalosDbContext db) =>
            {
                var rol = user.FindFirst(ClaimTypes.Role)?.Value ?? "Cliente";
                var idStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                int.TryParse(idStr, out int currentUserId);

                var query = db.ServiciosTecnicos
                    .Include(s => s.Cliente)
                    .Include(s => s.Tecnico)
                    .Include(s => s.TipoServicio)
                    .Include(s => s.Seguimientos)
                    .AsNoTracking()
                    .AsQueryable();

                if (rol == "Cliente")
                {
                    query = query.Where(s => s.ClienteId == currentUserId);
                }
                else
                {
                    if (!string.IsNullOrWhiteSpace(estado))
                    {
                        var est = estado.Trim();
                        if (est.Equals("En Revision", StringComparison.OrdinalIgnoreCase) ||
                            est.Equals("En Revisión", StringComparison.OrdinalIgnoreCase) ||
                            est.Equals("En Proceso", StringComparison.OrdinalIgnoreCase))
                        {
                            query = query.Where(s => s.Estado == "En Revisión" || s.Estado == "En Revision" || s.Estado == "En Proceso");
                        }
                        else if (est.Equals("En Reparacion", StringComparison.OrdinalIgnoreCase) ||
                                 est.Equals("En Reparación", StringComparison.OrdinalIgnoreCase))
                        {
                            query = query.Where(s => s.Estado == "En Reparación" || s.Estado == "En Reparacion");
                        }
                        else
                        {
                            query = query.Where(s => s.Estado == est);
                        }
                    }

                    if (tecnicoId.HasValue && tecnicoId.Value > 0)
                    {
                        query = query.Where(s => s.TecnicoId == tecnicoId.Value);
                    }
                }

                var lista = await query.OrderByDescending(s => s.FechaIngreso).ToListAsync();
                return Results.Ok(lista);
            });

            // GET: Detalle de un servicio técnico
            servicios.MapGet("/{id:int}", async (int id, ClaimsPrincipal user, BufalosDbContext db) =>
            {
                var rol = user.FindFirst(ClaimTypes.Role)?.Value ?? "Cliente";
                var idStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                int.TryParse(idStr, out int currentUserId);

                var servicio = await db.ServiciosTecnicos
                    .Include(s => s.Cliente)
                    .Include(s => s.Tecnico)
                    .Include(s => s.TipoServicio)
                    .Include(s => s.Seguimientos)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (servicio is null)
                {
                    return Results.NotFound(new { mensaje = "Servicio técnico no encontrado." });
                }

                if (rol == "Cliente" && servicio.ClienteId != currentUserId)
                {
                    return Results.Forbid();
                }

                return Results.Ok(servicio);
            });

            // POST: Registrar nueva solicitud de servicio técnico
            servicios.MapPost("/", async (CrearServicioRequest request, ClaimsPrincipal user, BufalosDbContext db) =>
            {
                if (string.IsNullOrWhiteSpace(request.DescripcionProblema))
                {
                    return Results.BadRequest(new { mensaje = "Debe ingresar una descripción detallada del problema." });
                }

                var idStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(idStr, out int currentUserId) || currentUserId <= 0)
                {
                    return Results.Unauthorized();
                }

                var tecnicoDefault = await db.Usuarios.FirstOrDefaultAsync(u => u.Id_Rol == 2);
                int defaultTecnicoId = tecnicoDefault?.Id ?? 2;

                var tipoId = request.TipoServicioId.GetValueOrDefault(1);
                if (tipoId <= 0) tipoId = 1;

                var tipoServicio = await db.TiposServicio.FindAsync(tipoId);
                var costoBase = tipoServicio?.CostoBase ?? 0;
                var costoFinal = request.CostoEstimado.HasValue && request.CostoEstimado.Value > 0
                    ? request.CostoEstimado.Value
                    : costoBase;

                var servicio = new ServicioTecnico
                {
                    ClienteId = currentUserId,
                    TecnicoId = defaultTecnicoId,
                    TipoServicioId = tipoId,
                    DescripcionProblema = request.DescripcionProblema.Trim(),
                    Estado = "En Revisión",
                    CostoEstimado = costoFinal,
                    FechaIngreso = DateTime.UtcNow
                };

                db.ServiciosTecnicos.Add(servicio);
                await db.SaveChangesAsync();

                // Registro en TB_DetallesParchesCustom
                var notaTexto = !string.IsNullOrWhiteSpace(request.ObservacionesDiseno)
                    ? request.ObservacionesDiseno.Trim()
                    : "Solicitud ingresada por el cliente a través de la plataforma web.";

                var seguimientoInicial = new ServicioTecnicoSeguimiento
                {
                    ServicioTecnicoId = servicio.Id,
                    TextoPersonalizado = request.TextoPersonalizado?.Trim(),
                    Dimensiones = request.Dimensiones?.Trim(),
                    TipoBordado = request.TipoBordado?.Trim(),
                    Cantidad = request.Cantidad.GetValueOrDefault(1) > 0 ? request.Cantidad.GetValueOrDefault(1) : 1,
                    Notas = notaTexto,
                    FechaRegistro = DateTime.UtcNow
                };
                db.ServicioTecnicoSeguimientos.Add(seguimientoInicial);
                await db.SaveChangesAsync();

                await db.Entry(servicio).Reference(s => s.Cliente).LoadAsync();
                await db.Entry(servicio).Reference(s => s.TipoServicio).LoadAsync();
                await db.Entry(servicio).Collection(s => s.Seguimientos).LoadAsync();

                return Results.Created($"/api/v1/servicios-tecnicos/{servicio.Id}", servicio);
            });

            // PUT: Actualizar estado, técnico asignado y/o costo (Técnico o Admin)
            servicios.MapPut("/{id:int}", async (int id, ActualizarServicioRequest request, ClaimsPrincipal user, BufalosDbContext db) =>
            {
                var servicio = await db.ServiciosTecnicos
                    .Include(s => s.Seguimientos)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (servicio is null)
                {
                    return Results.NotFound(new { mensaje = "Servicio técnico no encontrado." });
                }

                var cambios = new List<string>();

                if (!string.IsNullOrWhiteSpace(request.Estado) && request.Estado != servicio.Estado)
                {
                    var nuevoEstado = request.Estado.Trim();
                    if (nuevoEstado.Equals("En Revision", StringComparison.OrdinalIgnoreCase)) nuevoEstado = "En Revisión";
                    else if (nuevoEstado.Equals("En Reparacion", StringComparison.OrdinalIgnoreCase)) nuevoEstado = "En Reparación";

                    cambios.Add($"Estado modificado de '{servicio.Estado}' a '{nuevoEstado}'.");
                    servicio.Estado = nuevoEstado;
                }

                if (request.TecnicoId.HasValue && request.TecnicoId.Value > 0 && request.TecnicoId != servicio.TecnicoId)
                {
                    var tecnico = await db.Usuarios.FindAsync(request.TecnicoId.Value);
                    if (tecnico is not null)
                    {
                        servicio.TecnicoId = request.TecnicoId.Value;
                        cambios.Add($"Técnico asignado: {tecnico.NombreCompleto}.");
                    }
                }

                if (request.CostoEstimado.HasValue && request.CostoEstimado.Value >= 0)
                {
                    servicio.CostoEstimado = request.CostoEstimado.Value;
                }

                if (cambios.Count > 0)
                {
                    var autoNota = new ServicioTecnicoSeguimiento
                    {
                        ServicioTecnicoId = servicio.Id,
                        Notas = string.Join(" ", cambios),
                        FechaRegistro = DateTime.UtcNow
                    };
                    db.ServicioTecnicoSeguimientos.Add(autoNota);
                }

                await db.SaveChangesAsync();

                await db.Entry(servicio).Reference(s => s.Cliente).LoadAsync();
                if (servicio.TecnicoId.HasValue)
                {
                    await db.Entry(servicio).Reference(s => s.Tecnico).LoadAsync();
                }

                return Results.Ok(servicio);
            })
            .RequireAuthorization(policy => policy.RequireRole("Administrador", "Tecnico", "Técnico", "Admin"));

            // POST: Agregar nota de seguimiento (Técnico o Admin)
            servicios.MapPost("/{id:int}/seguimiento", async (int id, AgregarSeguimientoRequest request, BufalosDbContext db) =>
            {
                if (string.IsNullOrWhiteSpace(request.Notas))
                {
                    return Results.BadRequest(new { mensaje = "La nota de seguimiento no puede estar vacía." });
                }

                var existe = await db.ServiciosTecnicos.AnyAsync(s => s.Id == id);
                if (!existe)
                {
                    return Results.NotFound(new { mensaje = "Servicio técnico no encontrado." });
                }

                var seguimiento = new ServicioTecnicoSeguimiento
                {
                    ServicioTecnicoId = id,
                    TextoPersonalizado = request.TextoPersonalizado?.Trim(),
                    Dimensiones = request.Dimensiones?.Trim(),
                    TipoBordado = request.TipoBordado?.Trim(),
                    Cantidad = request.Cantidad.GetValueOrDefault(1) > 0 ? request.Cantidad.GetValueOrDefault(1) : 1,
                    Notas = request.Notas.Trim(),
                    FechaRegistro = DateTime.UtcNow
                };

                db.ServicioTecnicoSeguimientos.Add(seguimiento);
                await db.SaveChangesAsync();

                return Results.Created($"/api/v1/servicios-tecnicos/{id}/seguimiento/{seguimiento.Id}", seguimiento);
            })
            .RequireAuthorization(policy => policy.RequireRole("Administrador", "Tecnico", "Técnico", "Admin"));

            // GET: Listar tipos de servicio técnico disponibles (TB_TiposServicio)
            servicios.MapGet("/tipos", async (BufalosDbContext db) =>
            {
                var tipos = await db.TiposServicio.AsNoTracking().OrderBy(t => t.Nombre).ToListAsync();
                return Results.Ok(tipos);
            });
        }
    }

    public record CrearServicioRequest(
        string DescripcionProblema,
        decimal? CostoEstimado = null,
        int? TipoServicioId = null,
        string? TextoPersonalizado = null,
        string? Dimensiones = null,
        string? TipoBordado = null,
        int? Cantidad = null,
        string? ObservacionesDiseno = null
    );

    public record ActualizarServicioRequest(string? Estado, int? TecnicoId, decimal? CostoEstimado);

    public record AgregarSeguimientoRequest(
        string Notas,
        string? TextoPersonalizado = null,
        string? Dimensiones = null,
        string? TipoBordado = null,
        int? Cantidad = null
    );
}
