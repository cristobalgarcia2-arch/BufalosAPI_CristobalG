using System.Text.Json.Serialization;

namespace BufalosAPI.Models
{
    public class Proveedor
    {
        public int Id { get; set; }
        public string NombreEmpresa { get; set; } = string.Empty;
        public string? Contacto { get; set; }
        public string? Telefono { get; set; }
        public string? Correo { get; set; }

        [JsonIgnore]
        public ICollection<Producto> Productos { get; set; } = new List<Producto>();

        // Propiedades de compatibilidad
        public int Id_Proveedor => Id;
    }
}
