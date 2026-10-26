# Búfalos Tactical System &bull; Frontend, Consumo de API y Seguridad

Sistema integral de comercio y gestión operativa de equipamiento táctico, indumentaria de protección balística y servicios de personalización/reparación. Este proyecto integra una API RESTful desarrollada en **ASP.NET Core (.NET 10 Minimal API)** sobre **SQL Server (`Bufalos_DB`)** con una aplicación cliente moderna construida en **React 19**, **Vite**, **Tailwind CSS** y **TypeScript**, cubriendo el **100% de las 12 tablas relacionales del esquema de negocio**.

---

## 🚀 Requisitos del Sistema y Compatibilidad

- **.NET SDK:** .NET 10.0 (SDK 10.0.301+ / Runtime 10.0.9+). 
  > [!NOTE]
  > El backend fue migrado y optimizado a `net10.0` con dependencias `10.0.14` (`Microsoft.AspNetCore.*`, `Microsoft.EntityFrameworkCore.*`) y parche de seguridad `System.Security.Cryptography.Pkcs` v10.0.14 para garantizar compatibilidad nativa con entornos modernos y suites de pruebas de integración.
- **Node.js:** v20+ o v26+ (incluye npm).
- **Motor de Base de Datos:** [Microsoft SQL Server](https://www.microsoft.com/sql-server/) (Instancia local `localhost\SQLEXPRESS` con la base de datos `Bufalos_DB` importada desde `Bufalos_DB.sql`).
- **Navegador Web:** Chrome, Edge, Firefox o cualquier navegador moderno compatible con ECMAScript 2022+.

---

## ⚙️ Arquitectura del Repositorio (Monorepo Limpio)

El repositorio se organiza bajo una arquitectura Monorepo estándar, desacoplada y con control de versiones depurado:

```text
BufalosAPI/                                   # 📁 Raíz del repositorio Git
├── .agents/skills/                           # 🧠 38 Skills instaladas para el agente IA (ECC en español)
├── .gitignore                                # 🚫 Reglas de exclusión (bin, obj, node_modules, dist, .env)
├── AI_LOG.md                                 # 🤖 Bitácora transparente de Inteligencia Artificial Generativa
├── INFORME_TECNICO.md                        # 📄 Informe técnico formal, justificación y Matriz OWASP
├── README.md                                 # 📖 Guía completa de instalación y puesta en marcha
│
├── BufalosAPI/                               # ⚙️ Solución Backend (.NET 10 Minimal API)
│   ├── BufalosAPI.slnx                       # 📄 Archivo de solución .NET (XML ligero)
│   ├── BufalosAPI.Tests/                     # 🧪 Suite de pruebas de integración xUnit (WebApplicationFactory)
│   │   ├── BufalosAPI.Tests.csproj           # net10.0, Mvc.Testing 10.0.14, xUnit 2.9
│   │   └── ProductosApiTests.cs              # 5 pruebas de integración automatizadas
│   └── BufalosAPI/                           # 🚀 Proyecto Web API principal
│       ├── BufalosAPI.csproj                 # net10.0, EF Core 10.0.14, JWT Bearer 10.0.14, Scalar
│       ├── Program.cs                        # Pipeline: CORS, Rate Limiting, JWT, OpenAPI Scalar
│       ├── .env.example                      # Plantilla segura de variables de entorno backend
│       ├── appsettings.json                  # Cadena de conexión hacia localhost\SQLEXPRESS (Bufalos_DB)
│       ├── Data/
│       │   └── BufalosDbContext.cs           # Mapeo relacional de las 12 tablas de negocio
│       ├── Endpoints/
│       │   ├── CategoriaApi.cs               # GET /api/v1/categorias (recurso relacionado)
│       │   ├── ProductoApi.cs                # CRUD /api/v1/productos y proveedores oficiales
│       │   ├── UsuarioApi.cs                 # POST /registro, /login, /perfil, baneo y permisos
│       │   ├── PedidoApi.cs                  # POST /pedidos (validación regulatoria y stock)
│       │   └── ServicioTecnicoApi.cs         # GET/POST/PUT soporte, parches custom y bitácora
│       ├── Middleware/
│       │   └── ErrorAndLoggingMiddleware.cs  # Inyección de cabeceras de seguridad y captura 500 genérica
│       ├── Models/                           # Entidades del dominio balístico y táctico
│       └── Services/
│           └── AuthService.cs                # Hashing con BCrypt y generación de claims JWT
│
└── bufalos-frontend/                         # 💻 Aplicación Frontend (React 19 + Vite + TypeScript)
    ├── index.html                            # Punto de entrada con CSP estricto y lang="es"
    ├── package.json                          # Dependencias (TanStack Query, React Hook Form, Zod, Lucide)
    ├── vite.config.ts                        # Configuración de Vite y Vitest (JSDOM)
    ├── playwright.config.ts                  # Configuración de pruebas End-to-End
    ├── .env.example                          # Plantilla segura con VITE_API_URL
    ├── e2e/
    │   └── flujo-completo.spec.ts            # Prueba Playwright: Login -> Catálogo -> Nuevo Producto
    ├── public/                               # Iconos y recursos estáticos
    └── src/
        ├── App.tsx                           # Enrutador React Router 7 y React Query Provider
        ├── main.tsx                          # Montaje de la aplicación con ThemeProvider
        ├── index.css                         # Tokens de diseño CSS (Modo Oscuro Noche y Modo Claro)
        ├── components/
        │   ├── common/                       # Componentes accesibles (Modal, Spinner, Alerts, ProductImage)
        │   ├── guards/                       # ProtectedRoute con validación RBAC y 403 Forbidden
        │   └── layout/                       # Navbar (con toggle de tema), Footer y Layout accesible
        ├── context/
        │   ├── AuthContext.tsx               # Estado global de sesión, token JWT y roles
        │   └── ThemeContext.tsx              # Gestión de Modo Oscuro / Modo Claro (data-theme)
        ├── pages/
        │   ├── CatalogoPage.tsx              # Catálogo unificado (Galería 4x vs Lista, CRUD y filtros)
        │   ├── ProductoDetallePage.tsx       # Ficha técnica balística completa con proveedores y compra
        │   ├── LoginPage.tsx                 # Login y Registro multi-rol con Zod y cuentas demo
        │   ├── AccesoDenegadoPage.tsx        # Vista amigable de intercepción HTTP 403 Forbidden
        │   ├── NotFoundPage.tsx              # Vista HTTP 404
        │   ├── ClientePanelPage.tsx          # Panel cliente: Mis pedidos y solicitud de tickets/parches
        │   ├── TecnicoPanelPage.tsx          # Panel técnico: Despachos y tickets con bitácora plegable
        │   └── admin/
        │       ├── AdminDashboardPage.tsx    # Dashboard maestro con métricas y sincronización en vivo
        │       ├── AdminUsuariosPage.tsx     # Página 'Usuarios y Permisos' (Gestión de usuarios, baneo y permisos especiales)
        │       └── ProductoFormPage.tsx      # Formulario unificado (POST/PUT) con gestión de imágenes
        ├── services/
        │   ├── apiClient.ts                  # Axios centralizado con interceptores JWT, 401 y 429
        │   ├── authService.ts                # Login, registro y perfil
        │   ├── productoService.ts            # CRUD de productos y proveedores oficiales
        │   ├── categoriaService.ts           # Categorías de artículos
        │   ├── pedidoService.ts              # Creación de pedidos y actualización de despachos
        │   ├── servicioTecnicoService.ts     # Tickets de servicio y notas de bitácora
        │   └── usuarioService.ts             # Listado, baneo y asignación de permisos
        ├── test/                             # 19 pruebas de componentes con Vitest + Testing Library
        └── types/
            └── index.ts                      # Interfaces TypeScript y contratos DTO estrictos
```

---

## 🛠️ Puesta en Marcha Paso a Paso

### Paso 1: Configurar la Base de Datos (SQL Server)
1. Abra **SQL Server Management Studio (SSMS)** o Azure Data Studio conectándose a `localhost\SQLEXPRESS`.
2. Abra el archivo `Bufalos_DB.sql` provisto en el proyecto y ejecute el script completo.
3. Se creará la base de datos `Bufalos_DB` con las **12 tablas relacionales**, roles (`Administrador`, `Técnico`, `Cliente`), categorías tácticas, proveedores oficiales y artículos sembrados.
4. Verifique que la cadena de conexión en `BufalosAPI/BufalosAPI/appsettings.json` apunte a su instancia:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=Bufalos_DB;Trusted_Connection=True;TrustServerCertificate=True;"
   }
   ```

---

### Paso 2: Iniciar el Backend (.NET 10 Minimal API)
Abra una terminal PowerShell y ejecute:

```powershell
# Navegar al directorio del proyecto API
cd c:\Users\Alumnos\Downloads\BufalosAPI\BufalosAPI\BufalosAPI

# Compilar el proyecto
dotnet build

# Ejecutar la API RESTful
dotnet run
```

La consola confirmará que el servidor Kestrel está activo:
- **HTTP:** `http://localhost:51800`
- **HTTPS:** `https://localhost:51799`
- **Documentación Interactiva Scalar:** `https://localhost:51799/scalar/v1`

---

### Paso 3: Iniciar el Frontend (React + Vite)
Abra una segunda terminal PowerShell y ejecute:

```powershell
# Navegar al directorio de la aplicación web
cd c:\Users\Alumnos\Downloads\BufalosAPI\bufalos-frontend

# Instalar dependencias (solo la primera vez)
npm install

# Iniciar el entorno de desarrollo
npm run dev
```

La consola indicará que Vite está escuchando en:
👉 **`http://localhost:5173`**  
Abra esa dirección en su navegador web.

---

### Paso 4: Probar la Conectividad con SQL Server
Para verificar de inmediato que la API se comunica exitosamente con SQL Server:
1. Desde PowerShell:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:51800/api/v1/productos" -Method Get
   ```
2. O bien, acceda desde el navegador a `http://localhost:5173/catalogo` (tras iniciar sesión) para visualizar los artículos tácticos sembrados en `Bufalos_DB`.

---

## 🔑 Credenciales de Acceso para Demostración

La pantalla de inicio de sesión (`/login`) cuenta con **botones de prueba rápida** que rellenan automáticamente los campos, o puede ingresar de forma manual:

| Rol | Correo Electrónico | Contraseña | Capacidades y Vistas Autorizadas |
|---|---|---|---|
| **Administrador** | `admin@bufalos.cl` | `Admin123!` | **Control Total:** Acceso a *Catálogo e Inventario* con botones de Crear, Editar, Eliminar productos y actualizar imágenes; Panel Admin Master (`/admin`) con métricas en tiempo real; pestaña **Usuarios y Permisos** (`/admin/usuarios`, con la vista *"Gestión de Usuarios y Permisos Especiales"* para control de baneo y licencias regulatorias); supervisión técnica y de despachos. |
| **Técnico** | `tecnico@bufalos.cl` | `Tecnico123!` | **Operación Técnica (3 páginas autorizadas):** 1) Catálogo (`/catalogo`) en modo consulta; 2) Panel Técnico (`/tecnico` o `/soporte`) para gestionar tickets, asignar técnicos, ingresar notas de bitácora y despachar pedidos; 3) Gestión de Inventario (`/admin/productos` o `/inventario`) con la insignia *"Vista Operativa Técnico"* (sin permisos de edición ni eliminación). |
| **Cliente** | `cliente@bufalos.cl`<br>*(o `cliente@gmail.com`)* | `Cliente123!` | **Comercio y Soporte:** Consulta de Catálogo y Fichas Técnicas detalladas; compra directa de productos con cálculo de despacho (`CompraModal`); Panel del Cliente (`/cliente`) para consultar pedidos y solicitar tickets de soporte/parches custom con bitácora. Restringido ante rutas administrativas (HTTP 403). |

> [!TIP]
> **Registro de Nuevos Usuarios:** En la pantalla de login puede alternar a la pestaña **"Crear Cuenta"** para registrar nuevos usuarios seleccionando su rol (`Cliente`, `Técnico`, `Administrador`), conectando directamente con `POST /api/v1/usuarios/registro`.

---

## 🧪 Ejecución de Pruebas Automatizadas

### 1. Pruebas de Integración del Backend (.NET 10 xUnit)
```powershell
cd c:\Users\Alumnos\Downloads\BufalosAPI\BufalosAPI
dotnet test BufalosAPI.slnx
```
**Resultado:** **5 de 5 superadas (100% exitosas)** en `BufalosAPI.Tests.dll (net10.0)`:
- `GetProductos_DevuelveHttp200OK`
- `CrearProducto_SinToken_DevuelveHttp401Unauthorized`
- `GetCategorias_DevuelveHttp200OK` (Recurso relacionado)
- `Registro_SinContrasena_DevuelveHttp400BadRequest` (Observación subsanada Evaluación 1)
- `Login_AdminCredenciales_DevuelveHttp200OKYToken`

### 2. Pruebas Unitarias y de Componentes del Frontend (Vitest)
```powershell
cd c:\Users\Alumnos\Downloads\BufalosAPI\bufalos-frontend
npm test
```
**Resultado:** **19 de 19 superadas (100% exitosas)** en 5 suites:
- `src/test/Login.test.tsx` (3 tests: renderizado accesible, validación Zod y llamada de autenticación).
- `src/test/ProtectedRoute.test.tsx` (3 tests: bloqueo anónimo, paso concedido y captura 403 Forbidden).
- `src/test/CatalogoCRUD.test.tsx` (3 tests: carga de catálogo simulado, filtros y estado vacío).
- `src/test/AdminUsuariosYProveedores.test.tsx` (5 tests: listado de usuarios, asignación de permisos especiales y cadena de suministro).
- `src/test/NuevasFuncionalidades.test.tsx` (5 tests: registro multi-rol, toggle Galería 4x/Lista, switch Modo Oscuro/Claro y bitácora técnica plegable).

### 3. Prueba End-to-End (Playwright)
```powershell
cd c:\Users\Alumnos\Downloads\BufalosAPI\bufalos-frontend
npm run test:e2e
```
Valida la navegación completa: Login como Administrador &rarr; Navegación a Catálogo &rarr; Formulario de Nuevo Producto &rarr; Persistencia y verificación de inventario.

---

## 🧠 Resumen de Skills Instaladas (`.agents/skills/`)

El proyecto cuenta con **38 habilidades modulares en español** versionadas en `.agents/skills/`, procedentes de ECC (Engineering Capability Catalog).

### 1. ¿Qué es una Skill y cómo opera?
Una Skill es un paquete modular de directrices, patrones de código, listas de verificación de seguridad y flujos de trabajo (runbooks) que enseñan al asistente de IA a cumplir estándares de nivel de producción.
- **Divulgación Progresiva (*Progressive Disclosure*):** Al iniciar, el agente solo indexa el encabezado YAML (`name` y `description`) de cada `SKILL.md`. El contenido completo se carga a memoria únicamente cuando una tarea específica lo requiere, evitando saturar la ventana de contexto.
- **Invocación:** Puede utilizarse de forma **explícita** en los prompts (ej. *"Aplica la skill frontend-patterns para validar el formulario"* o *"Revisa la seguridad con security-review"*) o de forma **automática** por inferencia contextual.

### 2. Skills Núcleo Aplicadas en el Trabajo 2:
| Skill | Ubicación | Aportación al Proyecto |
|---|---|---|
| `frontend-patterns` | `.agents/skills/frontend-patterns/` | Arquitectura React 19 + Vite, formularios Zod, TanStack Query y accesibilidad WCAG 2.2 AA. |
| `security-review` | `.agents/skills/security-review/` | Auditoría de los 7 riesgos OWASP mitigados (XSS, robo de token, CSP, rate limiting, BFLA). |
| `api-design` | `.agents/skills/api-design/` | Contratos DTO, cliente HTTP centralizado Axios con interceptores JWT y normalización de errores (400, 401, 403, 429). |
| `tdd-workflow` | `.agents/skills/tdd-workflow/` | Diseño y ejecución de suites de pruebas con Vitest y xUnit. |
| `e2e-testing` | `.agents/skills/e2e-testing/` | Configuración de flujos End-to-End con Playwright (`flujo-completo.spec.ts`). |
| `coding-standards` | `.agents/skills/coding-standards/` | Estructura modular por capas/features, tipado estricto en TypeScript y linters. |
| `verification-loop` | `.agents/skills/verification-loop/` | Verificación sistemática de builds (`tsc -b`, `dotnet build`) y pruebas antes de cada entrega. |

*(El repositorio incluye además 31 skills complementarias: `backend-patterns`, `database-migrations`, `docker-patterns`, `postgres-patterns`, `continuous-learning`, etc.).*

---

## 🛡️ Matriz Resumida de Seguridad OWASP

Se mitigaron **7 riesgos de seguridad** (4 de ellos en el cliente):
1. **Inyección y XSS (Cliente):** Prohibición absoluta de `dangerouslySetInnerHTML`, sanitización React y política CSP estricta en `index.html`.
2. **Robo o Filtración de Token (Cliente):** Bearer token transportado en cabecera `Authorization` mediante interceptores Axios; purga inmediata en logout y ante respuesta HTTP 401. Tokens excluidos de URLs y consola.
3. **Consumo Inseguro y Secretos (Cliente):** Contratos DTO tipados con TypeScript y validación Zod; variables de entorno seguras (`VITE_API_URL` sin secretos en el bundle).
4. **Dependencias Vulnerables (Cliente):** Auditoría `npm audit` y actualización de paquetes.
5. **Control de Acceso Roto / BFLA (Ambos):** En cliente, `ProtectedRoute` intercepta accesos no autorizados hacia `/acceso-denegado` (HTTP 403); en API, endpoints protegidos con `.RequireRole("Administrador")`.
6. **Fuerza Bruta y Consumo Sin Límites (Ambos):** Rate limiting nativo en el backend sobre `/api/v1/usuarios/login` (10 req/min por IP) con respuesta normalizada 429 Too Many Requests.
7. **Configuración Insegura (API):** CORS con orígenes explícitos (`localhost:5173`), cabeceras HTTP (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `HSTS`, `X-XSS-Protection`) y manejo global de excepciones 500 sin exponer trazas internas.

---

## ♿ Accesibilidad y Diseño Responsivo (WCAG 2.2 Nivel AA)

- **HTML Semántico:** Landmarks (`<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`) y encabezados jerárquicos.
- **Formularios Accesibles:** Etiquetas vinculadas con `<label htmlFor>`, asociación de errores con `aria-describedby` y anuncios dinámicos con `aria-live`.
- **Navegación por Teclado:** Enlace de salto al contenido principal, anillo de foco visible (`:focus-visible` outline 2px con offset 2px) y modales con trampa de foco y soporte para tecla `Escape`.
- **Sistema de Temas de Alto Contraste:**
  - **Modo Oscuro (Noche Táctica):** Fondo `#0a0518` / `#0f0a1e`, superficies elevadas `#140d28`, bordes dorados `#f59e0b` y textos blancos `#ffffff` con ratios de contraste superiores a 7:1 y 11:1.
  - **Modo Claro (Operativo):** Fondo limpio `#f8fafc` / `#ffffff`, textos primarios `#0f172a` y acentos ámbar `#b45309`, superando el mínimo legal de 4.5:1.
- **Mobile-First:** Diseño fluido desde 320 px de ancho sin scroll horizontal; controles táctiles con tamaño mínimo garantizado de **44 × 44 px**; conversión automática de tablas a tarjetas táctiles en dispositivos móviles.
