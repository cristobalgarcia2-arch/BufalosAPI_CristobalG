using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using BufalosAPI.Data;
using BufalosAPI.Endpoints;
using BufalosAPI.Middlewares;
using BufalosAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
// using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Configurar serialización JSON para evitar errores por ciclos de referencia en Minimal APIs
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});

// 1. Configurar Entity Framework con SQL Server
builder.Services.AddDbContext<BufalosDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Registrar el servicio de autenticación
builder.Services.AddScoped<AuthService>();

// 3. Configurar CORS restringido a orígenes autorizados
const string CorsPolicy = "FrontendPolicy";
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",
            "https://localhost:5173",
            "http://localhost:3000",
            "https://localhost:3000"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

// 4. Configurar Rate Limiting para mitigar ataques de fuerza bruta (OWASP API4: Unrestricted Resource Consumption)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            status = 429,
            error = "TooManyRequests",
            mensaje = "Límite de peticiones excedido. Por seguridad, espere 1 minuto antes de reintentar."
        }, token);
    };

    options.AddFixedWindowLimiter("login-limiter", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });
});

// 5. Configurar autenticación y seguridad JWT
var jwtKey = builder.Configuration["Jwt:Key"] ?? "BufalosSuperSecretKey2026_ClaveMuySegura32Chars";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "BufalosApi",
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "BufalosClient",
        ValidateLifetime = true,
        RoleClaimType = ClaimTypes.Role,
        NameClaimType = ClaimTypes.Name,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Administrador"));
});

// 6. Configurar OpenAPI / Scalar (Comentado por compatibilidad con .NET 8)
// builder.Services.AddOpenApi();

var app = builder.Build();

// 7. Middleware de errores globales y cabeceras de seguridad
app.UseMiddleware<ErrorAndLoggingMiddleware>();

// 8. Documentación OpenAPI en Development (Comentado por compatibilidad con .NET 8)
// if (app.Environment.IsDevelopment())
// {
//     app.MapOpenApi();
//
//     app.MapScalarApiReference(options =>
//     {
//         options.Title = "Búfalos API - Equipamiento Táctico";
//         options.Theme = ScalarTheme.Purple;
//     });
// }

// 9. CORS antes de redirecciones para responder preflights OPTIONS con cabeceras correctas
app.UseCors(CorsPolicy);

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseRateLimiter();

// 10. Autenticación y Autorización
app.UseAuthentication();
app.UseAuthorization();

// 11. Endpoints de Minimal APIs
app.MapUsuarioApi();
app.MapProductoApi();
app.MapCategoriaApi();
app.MapPedidoApi();
app.MapServicioTecnicoApi();

app.Run();

public partial class Program { }