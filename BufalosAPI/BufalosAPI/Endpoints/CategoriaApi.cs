using BufalosAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace BufalosAPI.Endpoints
{
    public static class CategoriaApi
    {
        public static void MapCategoriaApi(this WebApplication app)
        {
            var categorias = app.MapGroup("/api/v1/categorias").WithTags("Categorías");

            // GET: Consultar todas las categorías (para filtros y selectores)
            categorias.MapGet("/", async (BufalosDbContext db) =>
            {
                var lista = await db.Categorias.AsNoTracking().ToListAsync();
                return Results.Ok(lista);
            });

            // GET: Categoría por ID
            categorias.MapGet("/{id:int}", async (int id, BufalosDbContext db) =>
            {
                var categoria = await db.Categorias.FindAsync(id);
                return categoria is not null
                    ? Results.Ok(categoria)
                    : Results.NotFound(new { mensaje = "Categoría no encontrada." });
            });
        }
    }
}
