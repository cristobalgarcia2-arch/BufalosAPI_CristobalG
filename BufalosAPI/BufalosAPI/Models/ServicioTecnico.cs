namespace BufalosAPI.Models
{
    public class ServicioTecnico
    {
        public int Id { get; set; }
        public int ClienteId { get; set; }
        public int? TecnicoId { get; set; }
        public int TipoServicioId { get; set; } = 1;
        public DateTime FechaIngreso { get; set; } = DateTime.UtcNow;
        public DateTime? FechaEstimadaEntrega { get; set; }
        public string Estado { get; set; } = "En Revisión";
        public string DescripcionProblema { get; set; } = string.Empty;
        public decimal CostoEstimado { get; set; }

        public Usuario? Cliente { get; set; }
        public Usuario? Tecnico { get; set; }
        public TipoServicio? TipoServicio { get; set; }
        public List<ServicioTecnicoSeguimiento> Seguimientos { get; set; } = new();

        public int Id_OrdenServicio => Id;
    }
}
