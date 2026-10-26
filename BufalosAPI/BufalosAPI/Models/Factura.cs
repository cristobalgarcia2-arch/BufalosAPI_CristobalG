using System.Text.Json.Serialization;

namespace BufalosAPI.Models
{
    public class Factura
    {
        public int Id { get; set; }
        public int PedidoId { get; set; }
        public string NumeroFactura { get; set; } = string.Empty;
        public decimal MontoTotal { get; set; }
        public DateTime FechaEmision { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public Pedido? Pedido { get; set; }
    }
}
