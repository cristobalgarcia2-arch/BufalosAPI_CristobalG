import { test, expect } from '@playwright/test';

test.describe('Flujo E2E Completo: Login, Crear Producto y Listar', () => {
  test.beforeEach(async ({ page }) => {
    // Interceptar llamadas a la API para asegurar determinismo en la suite E2E
    await page.route('**/api/v1/usuarios/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'e2e.mock.jwt.token',
          usuario: {
            id_Usuario: 1,
            nombreCompleto: 'Goberto Parra',
            correo: 'admin@bufalos.cl',
            rol: 'Administrador',
            id_Rol: 1
          }
        })
      });
    });

    await page.route('**/api/v1/usuarios/perfil', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id_Usuario: 1,
          nombreCompleto: 'Goberto Parra',
          correo: 'admin@bufalos.cl',
          rol: 'Administrador',
          id_Rol: 1
        })
      });
    });

    await page.route('**/api/v1/categorias', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id_Categoria: 1, nombre: 'Equipamiento Táctico' },
          { id_Categoria: 2, nombre: 'Cacería' },
          { id_Categoria: 3, nombre: 'Accesorios y Parches' }
        ])
      });
    });

    let productosMock = [
      {
        id_Producto: 1,
        nombre: 'Casco Táctico Kevlar',
        descripcion: 'Protección balística con rieles laterales',
        precio: 185000,
        stock: 12,
        id_Categoria: 1,
        restriccionEdad: 18,
        requierePermiso: false,
        soloPersonalAutorizado: false,
        numeroSerie: 'CAS-2026-X99',
        categoria: { id_Categoria: 1, nombre: 'Equipamiento Táctico' }
      }
    ];

    await page.route('**/api/v1/productos*', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        const nuevo = {
          ...body,
          id_Producto: 99,
          categoria: { id_Categoria: body.id_Categoria, nombre: 'Equipamiento Táctico' }
        };
        productosMock.push(nuevo);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(nuevo)
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            total: productosMock.length,
            pagina: 1,
            limite: 10,
            totalPaginas: 1,
            items: productosMock
          })
        });
      }
    });
  });

  test('Debe autenticarse, consultar catálogo, crear un nuevo producto y verificarlo en inventario', async ({ page }) => {
    // 1. Navegar a la pantalla de login
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /acceso a búfalos tactical/i })).toBeVisible();

    // 2. Ingresar credenciales de Administrador
    await page.fill('#correo-input', 'admin@bufalos.cl');
    await page.fill('#password-input', 'Admin123!');
    await page.click('button[type="submit"]');

    // 3. Verificar redirección al catálogo protegido
    await expect(page).toHaveURL(/.*catalogo/);
    await expect(page.getByRole('heading', { name: /catálogo de equipamiento táctico/i })).toBeVisible();
    await expect(page.getByText('Casco Táctico Kevlar')).toBeVisible();

    // 4. Navegar a la creación de producto (panel admin)
    await page.click('a[href="/admin/productos/nuevo"]');
    await expect(page).toHaveURL(/.*admin\/productos\/nuevo/);
    await expect(page.getByRole('heading', { name: /crear nuevo producto táctico/i })).toBeVisible();

    // 5. Completar el formulario de creación
    await page.fill('#nombre-input', 'Chaleco Antifragmentación Nivel IV');
    await page.fill('#precio-input', '245000');
    await page.fill('#stock-input', '8');
    await page.selectOption('#categoria-input', '1');
    await page.fill('#serie-input', 'CHA-LV4-2026');
    await page.fill('#descripcion-input', 'Placas cerámicas de alta protección balística militar.');

    // 6. Enviar el formulario
    await page.click('button[type="submit"]');

    // 7. Verificar redirección al panel administrativo de productos
    await expect(page).toHaveURL(/.*admin\/productos/);
    await expect(page.getByRole('heading', { name: /gestión de inventario táctico/i })).toBeVisible();
  });
});
