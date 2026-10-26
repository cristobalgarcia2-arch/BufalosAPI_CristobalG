namespace BufalosAPI.Models
{
    public class Producto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public decimal Precio { get; set; }
        public int Stock { get; set; }
        public int CategoriaId { get; set; }
        public bool Activo { get; set; } = true;
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public int RestriccionEdad { get; set; } = 0;
        public bool RequierePermiso { get; set; } = false;
        public bool SoloPersonalAutorizado { get; set; } = false;
        public string? NumeroSerie { get; set; }
        public string? ImagenUrl { get; set; }

        public Categoria? Categoria { get; set; }
        public ICollection<Proveedor> Proveedores { get; set; } = new List<Proveedor>();

        // Propiedades de compatibilidad con Frontend y DTOs
        public int Id_Producto => Id;
        public int Id_Categoria => CategoriaId;
        public List<int> ProveedorIds => Proveedores.Select(p => p.Id).ToList();
    }
}