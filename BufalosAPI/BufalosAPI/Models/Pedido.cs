using System.Text.Json.Serialization;

namespace BufalosAPI.Models
{
    public class Pedido
    {
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public DateTime FechaPedido { get; set; } = DateTime.UtcNow;
        public string EstadoPedido { get; set; } = "Completado";
        public string MetodoEntrega { get; set; } = "Despacho a Domicilio";
        public string DireccionEnvio { get; set; } = "Dirección registrada";
        public decimal Total { get; set; }

        public int EstadoId
        {
            get => EstadoPedido switch
            {
                "Pendiente" => 1,
                "Completado" or "Pagado" => 2,
                "Enviado" => 3,
                "Cancelado" => 4,
                _ => 2
            };
            set => EstadoPedido = value switch
            {
                1 => "Pendiente",
                2 => "Completado",
                3 => "Enviado",
                4 => "Cancelado",
                _ => "Completado"
            };
        }

        // Relaciones de navegación
        public Usuario? Usuario { get; set; }
        public List<DetallePedido> Detalles { get; set; } = new();

        // DTOs auxiliares para serialización hacia el frontend
        public EstadoPedidoDto Estado => new(EstadoId, EstadoPedido);
        public FacturaDto Factura => new(Id, $"FAC-{FechaPedido:yyyyMMdd}-{Id:D5}", Total, FechaPedido.ToString("o"));

        // Getters para compatibilidad histórica
        [JsonIgnore]
        public int Id_Pedido => Id;
        [JsonIgnore]
        public int Id_Usuario => UsuarioId;
    }

    public record EstadoPedidoDto(int Id, string Nombre);
    public record FacturaDto(int PedidoId, string NumeroFactura, decimal MontoTotal, string FechaEmision);
}