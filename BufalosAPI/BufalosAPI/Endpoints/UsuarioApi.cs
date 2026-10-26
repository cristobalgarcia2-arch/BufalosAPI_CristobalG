using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using BufalosAPI.Data;
using BufalosAPI.Models;
using BufalosAPI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace BufalosAPI.Endpoints
{
    public static class UsuarioApi
    {
        public static void MapUsuarioApi(this WebApplication app)
        {
            var usuarios = app.MapGroup("/api/v1/usuarios").WithTags("Usuarios");

            // POST: Registro de usuario con validación estricta
            usuarios.MapPost("/registro", async (RegistroRequest? req, BufalosDbContext db, AuthService auth) =>
            {
                if (req is null)
                {
                    return Results.BadRequest(new
                    {
                        status = 400,
                        mensaje = "El cuerpo de la solicitud no puede estar vacío."
                    });
                }

                var errors = new Dictionary<string, string>();

                if (string.IsNullOrWhiteSpace(req.NombreCompleto))
                    errors["nombreCompleto"] = "El nombre completo es obligatorio.";

                if (string.IsNullOrWhiteSpace(req.Correo))
                    errors["correo"] = "El correo electrónico es obligatorio.";
                else if (!Regex.IsMatch(req.Correo, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                    errors["correo"] = "El formato del correo electrónico no es válido.";

                if (string.IsNullOrWhiteSpace(req.Password))
                    errors["password"] = "La contraseña no puede estar vacía.";
                else if (req.Password.Length < 6)
                    errors["password"] = "La contraseña debe tener al menos 6 caracteres.";

                if (req.Id_Rol <= 0)
                    errors["id_Rol"] = "Debe indicar un rol válido.";

                if (errors.Count > 0)
                {
                    return Results.BadRequest(new
                    {
                        status = 400,
                        mensaje = "Errores de validación en los datos de entrada.",
                        errors
                    });
                }

                var emailLimpio = req.Correo!.Trim().ToLower();
                var correoExistente = await db.Usuarios.AnyAsync(u => u.Correo.ToLower() == emailLimpio);
                if (correoExistente)
                {
                    return Results.BadRequest(new
                    {
                        status = 400,
                        mensaje = "El correo electrónico ya se encuentra registrado."
                    });
                }

                var nuevoUsuario = new Usuario
                {
                    NombreCompleto = req.NombreCompleto!.Trim(),
                    Correo = emailLimpio,
                    ContrasenaHash = auth.HashPassword(req.Password ?? string.Empty),
                    Id_Rol = req.Id_Rol,
                    FechaNacimiento = req.FechaNacimiento,
                    EsVerificado = true,
                    FechaCreacion = DateTime.UtcNow
                };

                db.Usuarios.Add(nuevoUsuario);
                await db.SaveChangesAsync();

                return Results.Created($"/api/v1/usuarios/{nuevoUsuario.Id}", new
                {
                    id_Usuario = nuevoUsuario.Id,
                    nombreCompleto = nuevoUsuario.NombreCompleto,
                    correo = nuevoUsuario.Correo,
                    id_Rol = nuevoUsuario.Id_Rol
                });
            });

            // POST: Login con rate limiting y respuesta normalizada
            usuarios.MapPost("/login", async (LoginRequest? login, BufalosDbContext db, AuthService auth, IConfiguration config) =>
            {
                if (login is null || string.IsNullOrWhiteSpace(login.Correo) || string.IsNullOrWhiteSpace(login.Password))
                {
                    return Results.BadRequest(new
                    {
                        status = 400,
                        mensaje = "Debe proporcionar correo y contraseña."
                    });
                }

                var correoLimpio = login.Correo.Trim().ToLower();
                var usuario = await db.Usuarios
                    .Include(u => u.Rol)
                    .FirstOrDefaultAsync(u => u.Correo.ToLower() == correoLimpio);

                if (usuario is null || !auth.VerifyPassword(login.Password, usuario.ContrasenaHash))
                {
                    return Results.Json(new
                    {
                        status = 401,
                        mensaje = "Credenciales incorrectas o usuario no encontrado."
                    }, statusCode: StatusCodes.Status401Unauthorized);
                }

                if (!usuario.EsVerificado)
                {
                    return Results.Json(new
                    {
                        status = 403,
                        mensaje = "Su cuenta ha sido suspendida/baneada por la administración."
                    }, statusCode: StatusCodes.Status403Forbidden);
                }

                var rolNombre = usuario.Rol?.Nombre ?? "Cliente";
                if (string.Equals(rolNombre, "Admin", StringComparison.OrdinalIgnoreCase))
                {
                    rolNombre = "Administrador";
                }
                else if (string.Equals(rolNombre, "Técnico", StringComparison.OrdinalIgnoreCase) ||
                         string.Equals(rolNombre, "Tecnico", StringComparison.OrdinalIgnoreCase))
                {
                    rolNombre = "Tecnico";
                }

                var nombreCompleto = $"{usuario.Nombre} {usuario.Apellido}".Trim();

                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                    new Claim(ClaimTypes.Name, nombreCompleto),
                    new Claim(ClaimTypes.Email, usuario.Email),
                    new Claim(ClaimTypes.Role, rolNombre)
                };

                if (rolNombre == "Tecnico")
                {
                    claims.Add(new Claim(ClaimTypes.Role, "Técnico"));
                }
                else if (rolNombre == "Administrador")
                {
                    claims.Add(new Claim(ClaimTypes.Role, "Admin"));
                }

                var jwtKey = config["Jwt:Key"] ?? "BufalosSuperSecretKey2026_ClaveMuySegura32Chars";
                var jwtIssuer = config["Jwt:Issuer"] ?? "BufalosApi";
                var jwtAudience = config["Jwt:Audience"] ?? "BufalosClient";

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
                var credenciales = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var token = new JwtSecurityToken(
                    issuer: jwtIssuer,
                    audience: jwtAudience,
                    claims: claims,
                    expires: DateTime.UtcNow.AddHours(4),
                    signingCredentials: credenciales
                );

                var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

                return Results.Ok(new
                {
                    token = tokenString,
                    usuario = new
                    {
                        id_Usuario = usuario.Id,
                        nombreCompleto,
                        correo = usuario.Email,
                        rol = rolNombre,
                        id_Rol = usuario.RolId
                    }
                });
            })
            .RequireRateLimiting("login-limiter");

            // GET: Perfil del usuario autenticado
            usuarios.MapGet("/perfil", async (ClaimsPrincipal user, BufalosDbContext db) =>
            {
                var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var idUsuario))
                {
                    return Results.Unauthorized();
                }

                var usuario = await db.Usuarios
                    .Include(u => u.Rol)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == idUsuario);

                if (usuario is null)
                {
                    return Results.NotFound(new { mensaje = "Usuario no encontrado." });
                }

                var rolNombre = usuario.Rol?.Nombre ?? "Cliente";
                if (string.Equals(rolNombre, "Admin", StringComparison.OrdinalIgnoreCase))
                {
                    rolNombre = "Administrador";
                }
                else if (string.Equals(rolNombre, "Técnico", StringComparison.OrdinalIgnoreCase) ||
                         string.Equals(rolNombre, "Tecnico", StringComparison.OrdinalIgnoreCase))
                {
                    rolNombre = "Tecnico";
                }

                var nombreCompleto = $"{usuario.Nombre} {usuario.Apellido}".Trim();

                return Results.Ok(new
                {
                    id_Usuario = usuario.Id,
                    nombreCompleto,
                    correo = usuario.Email,
                    rol = rolNombre,
                    id_Rol = usuario.RolId,
                    esVerificado = usuario.Activo,
                    fechaCreacion = usuario.FechaCreacion
                });
            })
            .RequireAuthorization();

            // GET: Listar técnicos del sistema (para asignación en Panel Técnico y Admin)
            usuarios.MapGet("/tecnicos", async (BufalosDbContext db) =>
            {
                var tecnicos = await db.Usuarios
                    .Include(u => u.Rol)
                    .Where(u => u.Id_Rol == 2 || (u.Rol != null && (u.Rol.Nombre == "Técnico" || u.Rol.Nombre == "Tecnico")))
                    .AsNoTracking()
                    .Select(u => new
                    {
                        id = u.Id,
                        id_Usuario = u.Id,
                        nombreCompleto = u.NombreCompleto,
                        correo = u.Correo,
                        rol = u.Rol != null ? u.Rol.Nombre : "Técnico"
                    })
                    .ToListAsync();

                return Results.Ok(tecnicos);
            })
            .RequireAuthorization(policy => policy.RequireRole("Administrador", "Tecnico", "Técnico", "Admin"));

            // GET: Listar todos los usuarios con roles y permisos (Exclusivo Administrador)
            usuarios.MapGet("/", async (BufalosDbContext db) =>
            {
                var list = await db.Usuarios
                    .Include(u => u.Rol)
                    .Include(u => u.Permisos)
                    .AsNoTracking()
                    .OrderBy(u => u.Id)
                    .Select(u => new
                    {
                        id_Usuario = u.Id,
                        nombreCompleto = u.NombreCompleto,
                        correo = u.Correo,
                        id_Rol = u.Id_Rol,
                        rol = u.Rol != null ? u.Rol.Nombre : "Cliente",
                        esVerificado = u.EsVerificado,
                        fechaNacimiento = u.FechaNacimiento,
                        fechaCreacion = u.FechaCreacion,
                        permisos = u.Permisos.Select(p => new
                        {
                            id_Permiso = p.Id,
                            id_Usuario = p.UsuarioId,
                            tipoPermiso = p.TipoPermiso,
                            numeroDocumento = p.NumeroDocumento,
                            fechaExpiracion = p.FechaExpiracion,
                            estado = p.Estado
                        }).ToList()
                    })
                    .ToListAsync();

                return Results.Ok(list);
            })
            .RequireAuthorization(policy => policy.RequireRole("Administrador", "Admin"));

            // PUT: Cambiar estado de cuenta (Activar o Banear/Desactivar) (Exclusivo Administrador)
            usuarios.MapPut("/{id:int}/estado", async (int id, EstadoUsuarioRequest req, BufalosDbContext db) =>
            {
                var usuario = await db.Usuarios.FindAsync(id);
                if (usuario is null)
                {
                    return Results.NotFound(new { mensaje = "Usuario no encontrado." });
                }

                usuario.EsVerificado = req.EsVerificado;
                await db.SaveChangesAsync();

                return Results.Ok(new
                {
                    mensaje = req.EsVerificado ? "Cuenta de usuario activada con éxito." : "Cuenta de usuario suspendida/baneada con éxito.",
                    id_Usuario = usuario.Id,
                    esVerificado = usuario.EsVerificado
                });
            })
            .RequireAuthorization(policy => policy.RequireRole("Administrador", "Admin"));

            // POST: Otorgar permiso especial a un usuario (Exclusivo Administrador)
            usuarios.MapPost("/{id:int}/permisos", async (int id, PermisoUsuarioRequest req, BufalosDbContext db) =>
            {
                var usuario = await db.Usuarios.FindAsync(id);
                if (usuario is null)
                {
                    return Results.NotFound(new { mensaje = "Usuario no encontrado." });
                }

                if (string.IsNullOrWhiteSpace(req.TipoPermiso))
                {
                    return Results.BadRequest(new { mensaje = "El tipo de permiso es obligatorio." });
                }

                var nuevoPermiso = new PermisoUsuario
                {
                    UsuarioId = id,
                    TipoPermiso = req.TipoPermiso.Trim(),
                    NumeroDocumento = string.IsNullOrWhiteSpace(req.NumeroDocumento) ? $"DOC-{DateTime.UtcNow.Ticks % 1000000}" : req.NumeroDocumento.Trim(),
                    FechaExpiracion = req.FechaExpiracion ?? DateTime.UtcNow.AddYears(1),
                    Estado = "Activo"
                };

                db.PermisosUsuarios.Add(nuevoPermiso);
                await db.SaveChangesAsync();

                return Results.Created($"/api/v1/usuarios/{id}/permisos/{nuevoPermiso.Id}", new
                {
                    id_Permiso = nuevoPermiso.Id,
                    id_Usuario = nuevoPermiso.UsuarioId,
                    tipoPermiso = nuevoPermiso.TipoPermiso,
                    numeroDocumento = nuevoPermiso.NumeroDocumento,
                    fechaExpiracion = nuevoPermiso.FechaExpiracion,
                    estado = nuevoPermiso.Estado
                });
            })
            .RequireAuthorization(policy => policy.RequireRole("Administrador", "Admin"));

            // DELETE: Revocar o eliminar permiso especial de un usuario (Exclusivo Administrador)
            usuarios.MapDelete("/{id:int}/permisos/{permisoId:int}", async (int id, int permisoId, BufalosDbContext db) =>
            {
                var permiso = await db.PermisosUsuarios.FirstOrDefaultAsync(p => p.Id == permisoId && p.UsuarioId == id);
                if (permiso is null)
                {
                    return Results.NotFound(new { mensaje = "Permiso no encontrado para este usuario." });
                }

                db.PermisosUsuarios.Remove(permiso);
                await db.SaveChangesAsync();

                return Results.Ok(new { mensaje = "Permiso revocado con éxito." });
            })
            .RequireAuthorization(policy => policy.RequireRole("Administrador", "Admin"));
        }

        public record EstadoUsuarioRequest(bool EsVerificado);
        public record PermisoUsuarioRequest(string TipoPermiso, string? NumeroDocumento, DateTime? FechaExpiracion);

        public record RegistroRequest(
            string? NombreCompleto,
            string? Correo,
            string? Password,
            int Id_Rol,
            DateTime FechaNacimiento,
            bool EsVerificado
        );

        public record LoginRequest(string? Correo, string? Password);
    }
}