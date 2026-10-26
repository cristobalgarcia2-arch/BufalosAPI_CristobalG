namespace BufalosAPI.Models
{
    public class Rol
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public int Id_Rol => Id;
    }
}