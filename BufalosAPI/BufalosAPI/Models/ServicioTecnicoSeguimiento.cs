using System.Text.Json.Serialization;

namespace BufalosAPI.Models
{
    public class ServicioTecnicoSeguimiento
    {
        public int Id { get; set; }
        public int ServicioTecnicoId { get; set; }
        public string? TextoPersonalizado { get; set; }
        public string? Dimensiones { get; set; }
        public string? TipoBordado { get; set; }
        public int Cantidad { get; set; } = 1;
        public string Notas { get; set; } = string.Empty;
        public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

        // Propiedades de compatibilidad con TB_DetallesParchesCustom
        public int Id_DetalleParche => Id;
        public int Id_OrdenServicio => ServicioTecnicoId;
        public string? ObservacionesDiseno
        {
            get => Notas;
            set => Notas = value ?? string.Empty;
        }

        [JsonIgnore]
        public ServicioTecnico? ServicioTecnico { get; set; }
    }
}
