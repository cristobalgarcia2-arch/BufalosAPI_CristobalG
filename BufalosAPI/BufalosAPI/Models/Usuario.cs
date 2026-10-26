namespace BufalosAPI.Models
{
    public class Usuario
    {
        public int Id { get; set; }
        public string NombreCompleto { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string ContrasenaHash { get; set; } = string.Empty;
        public int Id_Rol { get; set; }
        public DateTime? FechaNacimiento { get; set; }
        public bool EsVerificado { get; set; } = true;
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public Rol? Rol { get; set; }
        public ICollection<PermisoUsuario> Permisos { get; set; } = new List<PermisoUsuario>();

        // Propiedades de compatibilidad con Frontend, DTOs y lógica existente
        public int Id_Usuario => Id;
        public int RolId { get => Id_Rol; set => Id_Rol = value; }
        public string Email { get => Correo; set => Correo = value; }
        public string PasswordHash { get => ContrasenaHash; set => ContrasenaHash = value; }
        public bool Activo { get => EsVerificado; set => EsVerificado = value; }
        public string Nombre => !string.IsNullOrEmpty(NombreCompleto) ? NombreCompleto.Split(' ', 2)[0] : string.Empty;
        public string Apellido => (!string.IsNullOrEmpty(NombreCompleto) && NombreCompleto.Split(' ', 2).Length > 1) ? NombreCompleto.Split(' ', 2)[1] : string.Empty;
    }
}