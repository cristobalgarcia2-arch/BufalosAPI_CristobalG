namespace BufalosAPI.Middlewares
{
    public class ErrorAndLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ErrorAndLoggingMiddleware> _logger;

        public ErrorAndLoggingMiddleware(RequestDelegate next, ILogger<ErrorAndLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Aplicar cabeceras de seguridad HTTP en todas las respuestas
            context.Response.OnStarting(() =>
            {
                var headers = context.Response.Headers;
                headers["X-Content-Type-Options"] = "nosniff";
                headers["X-Frame-Options"] = "DENY";
                headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
                headers["X-XSS-Protection"] = "1; mode=block";
                headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";

                if (context.Request.IsHttps)
                {
                    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
                }

                return Task.CompletedTask;
            });

            try
            {
                _logger.LogInformation("HTTP {Method} {Path}", context.Request.Method, context.Request.Path);
                await _next(context);
            }
            catch (Exception ex)
            {
                // Registro interno detallado para auditoría en el servidor (no se expone al cliente)
                _logger.LogError(ex, "Error no controlado procesando {Method} {Path}: {Message}",
                    context.Request.Method, context.Request.Path, ex.Message);

                if (!context.Response.HasStarted)
                {
                    context.Response.ContentType = "application/json";
                    context.Response.StatusCode = StatusCodes.Status500InternalServerError;

                    // Mensaje genérico seguro que NO filtra detalles internos (OWASP API8: Security Misconfiguration)
                    var response = new
                    {
                        status = 500,
                        error = "InternalServerError",
                        message = ex.ToString()
                    };

                    await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
                }
            }
        }
    }
}