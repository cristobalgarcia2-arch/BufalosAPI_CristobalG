namespace BufalosAPI.Models
{
    public class PermisoUsuario
    {
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public string TipoPermiso { get; set; } = string.Empty;
        public string NumeroDocumento { get; set; } = string.Empty;
        public DateTime FechaExpiracion { get; set; }
        public string? Estado { get; set; } = "Activo";

        public Usuario? Usuario { get; set; }

        // Propiedades de compatibilidad
        public int Id_Permiso => Id;
        public int Id_Usuario => UsuarioId;
    }
}
