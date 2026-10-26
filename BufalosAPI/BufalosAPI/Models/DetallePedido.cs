using System.Text.Json.Serialization;

namespace BufalosAPI.Models
{
    public class DetallePedido
    {
        public int Id { get; set; }
        public int PedidoId { get; set; }
        public int ProductoId { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }

        public Producto? Producto { get; set; }

        [JsonIgnore]
        public Pedido? Pedido { get; set; }

        // Compatibilidad histórica
        [JsonIgnore]
        public int Id_DetallePedido => Id;
        [JsonIgnore]
        public int Id_Pedido => PedidoId;
        [JsonIgnore]
        public int Id_Producto => ProductoId;
    }
}
