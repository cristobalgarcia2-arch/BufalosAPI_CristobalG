import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { CatalogoPage } from './pages/CatalogoPage';
import { ProductoDetallePage } from './pages/ProductoDetallePage';
import { ClientePanelPage } from './pages/cliente/ClientePanelPage';
import { TecnicoPanelPage } from './pages/tecnico/TecnicoPanelPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsuariosPage } from './pages/admin/AdminUsuariosPage';
import { ProductoFormPage } from './pages/admin/ProductoFormPage';
import { AccesoDenegadoPage } from './pages/AccesoDenegadoPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos de caché fresco
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Rutas Públicas */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/acceso-denegado" element={<AccesoDenegadoPage />} />

              {/* Rutas Protegidas dentro de Layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Navigate to="/catalogo" replace />} />
                <Route path="/catalogo" element={<CatalogoPage />} />
                <Route path="/productos/:id" element={<ProductoDetallePage />} />

                {/* Panel de Cliente: Consulta de pedidos y solicitudes técnicas */}
                <Route
                  path="/cliente"
                  element={
                    <ProtectedRoute requiredRole="Cliente">
                      <ClientePanelPage />
                    </ProtectedRoute>
                  }
                />

                {/* Panel Técnico: Diagnóstico, soporte y despacho */}
                <Route
                  path="/tecnico"
                  element={
                    <ProtectedRoute requiredRole={['Tecnico', 'Administrador']}>
                      <TecnicoPanelPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/soporte" element={<Navigate to="/tecnico" replace />} />

                {/* Panel Master Administrador: Dashboard de métricas globales */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="Administrador">
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Gestión de Usuarios y Permisos Especiales (Exclusivo Administrador) */}
                <Route
                  path="/admin/usuarios"
                  element={
                    <ProtectedRoute requiredRole="Administrador">
                      <AdminUsuariosPage />
                    </ProtectedRoute>
                  }
                />

                {/* Redirección de Inventario Unificado al Catálogo General */}
                <Route path="/admin/productos" element={<Navigate to="/catalogo" replace />} />
                <Route path="/inventario" element={<Navigate to="/catalogo" replace />} />
                <Route path="/admin/inventario" element={<Navigate to="/catalogo" replace />} />

                {/* Operaciones de Mutación CRUD: Restringidas exclusivamente a Administrador */}
                <Route
                  path="/admin/productos/nuevo"
                  element={
                    <ProtectedRoute requiredRole="Administrador">
                      <ProductoFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/productos/editar/:id"
                  element={
                    <ProtectedRoute requiredRole="Administrador">
                      <ProductoFormPage />
                    </ProtectedRoute>
                  }
                />

                {/* Ruta 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
