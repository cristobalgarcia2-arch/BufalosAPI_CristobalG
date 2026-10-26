using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace BufalosAPI.Tests
{
    public class ProductosApiTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public ProductosApiTests(WebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetProductos_DevuelveHttp200OK()
        {
            // Act: Consultar el catálogo de productos
            var response = await _client.GetAsync("/api/v1/productos");
            var body = await response.Content.ReadAsStringAsync();

            // Assert: Verificar contrato y código de respuesta HTTP 200 OK
            Assert.True(response.StatusCode == HttpStatusCode.OK, body);
        }

        [Fact]
        public async Task CrearProducto_SinToken_DevuelveHttp401Unauthorized()
        {
            // Act: Intentar crear un producto sin cabecera Authorization
            var response = await _client.PostAsJsonAsync("/api/v1/productos", new
            {
                Nombre = "Polera Táctica Test",
                Precio = 1000,
                Stock = 5,
                Id_Categoria = 1
            });

            // Assert: Verificar protección de seguridad (401 Unauthorized)
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetCategorias_DevuelveHttp200OK()
        {
            // Act: Consultar el listado de categorías (recurso relacionado)
            var response = await _client.GetAsync("/api/v1/categorias");

            // Assert: Verifica que el recurso relacionado responde con 200 OK
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task Registro_SinContrasena_DevuelveHttp400BadRequest()
        {
            // Act: Registro con contraseña vacía (Observación subsanada del Trabajo 1: antes daba 500, ahora 400)
            var response = await _client.PostAsJsonAsync("/api/v1/usuarios/registro", new
            {
                NombreCompleto = "Test User",
                Correo = "test_sin_password@bufalos.cl",
                Password = "",
                Id_Rol = 3
            });

            // Assert: La validación controlada retorna 400 Bad Request
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Login_AdminCredenciales_DevuelveHttp200OKYToken()
        {
            // Act: Intentar login con las credenciales de prueba
            var response = await _client.PostAsJsonAsync("/api/v1/usuarios/login", new
            {
                Correo = "admin@bufalos.cl",
                Password = "admin123"
            });

            // Assert: Debe retornar 200 OK
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var json = await response.Content.ReadAsStringAsync();
            Assert.Contains("token", json);
            Assert.Contains("Administrador", json);
        }
    }
}