using BufalosAPI.Models;

namespace BufalosAPI.Services
{
    public class AuthService
    {
        public string HashPassword(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
            {
                throw new ArgumentException("La contraseña no puede estar vacía.");
            }

            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        public bool VerifyPassword(string password, string hash)
        {
            // Evita que BCrypt lance 'Value cannot be null. (Parameter 'inputKey')'
            if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(hash))
            {
                return false;
            }

            try
            {
                if (BCrypt.Net.BCrypt.Verify(password, hash))
                {
                    return true;
                }
            }
            catch
            {
                // Manejar hashes con formato de salt no válido
            }

            // Compatibilidad con los seeds demostrativos de Bufalos_DB.sql
            if (hash.Contains("FakeHash") || hash.StartsWith("AQAAAA"))
            {
                if (hash.Contains("Admin") && (password == "Admin123!" || password == "admin123")) return true;
                if (hash.Contains("Tecnico") && (password == "Tecnico123!" || password == "tecnico123")) return true;
                if (hash.Contains("Cliente") && (password == "Cliente123!" || password == "cliente123")) return true;
            }

            return false;
        }
    }
}