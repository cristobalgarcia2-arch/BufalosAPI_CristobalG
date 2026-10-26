# Bitácora de Uso de Inteligencia Artificial Generativa
**Asignatura:** Lenguaje Programación Web II  
**Evaluación:** Trabajo 2: Frontend, consumo de API y seguridad  
**Proyecto:** Sistema "Búfalos Tactical" (API RESTful .NET 10 + Frontend React 19)  
**Fecha:** Octubre 2026  

---

## 1. Declaración de Herramientas, Modelo y Entorno

- **Herramienta / Asistente:** Google Antigravity Agentic IDE
- **Modelo de Lenguaje:** Gemini 3.8 Flash
- **Tipo de Plan / Cuenta:** Plan Institucional / Pro
- **Habilidades Modulares (Skills) Integradas:** 38 habilidades en español procedentes de ECC (Engineering Capability Catalog) versionadas en `.agents/skills/`, entre las cuales se destacan:
  - `frontend-patterns`: Arquitectura React 19 + Vite, formularios React Hook Form con Zod, TanStack Query y accesibilidad WCAG 2.2 AA.
  - `security-review`: Matriz de mitigaciones OWASP Web y API Security Top 10 (2023).
  - `api-design`: Contratos DTO, cliente Axios con interceptores JWT y normalización de errores (400, 401, 403, 429).
  - `tdd-workflow` / `e2e-testing`: Pruebas de integración con xUnit (WebApplicationFactory), pruebas de componentes con Vitest y flujo E2E con Playwright.
  - `verification-loop`: Compilación estricta sin errores de tipos (`tsc -b`, `dotnet build`) y pruebas en verde.

---

## 2. Registro Cronológico de Prompts, Respuestas y Decisiones Técnicas

### Sesión 1: Incorporación de Skills y Conceptos de Arquitectura
- **Prompt Utilizado:**
  > *"Añade las siguientes skills y explícame lo básico de cómo se utilizan y cómo funcionan: https://github.com/affaan-m/ECC/tree/main/docs/es."*
- **Qué generó la IA:**
  - Descarga e indexación de 38 skills modulares en español dentro de `.agents/skills/`.
  - Explicación del mecanismo de Divulgación Progresiva (*Progressive Disclosure*): indexación ligera en el inicio mediante encabezados YAML (`name`, `description`) y carga completa bajo demanda.
  - Definición de los dos modos de uso: Invocación Explícita (guiando al asistente con el nombre de la skill) e Invocación Automática (detección contextual).
- **Decisión Tomada:** Se aceptó la incorporación de las 38 skills para estandarizar el desarrollo de las capas de frontend, backend, seguridad y pruebas.

---

### Sesión 2: Reutilización y Corrección de la API del Trabajo 1
- **Prompt Utilizado:**
  > *"Analiza la solución actual de BufalosAPI. Revisa el informe técnico anterior con las observaciones de la Evaluación 1, especialmente el fallo por contraseña vacía que provocaba HTTP 500 y la falta de actualización (PUT). Corrige la cadena de conexión hacia la instancia `localhost\SQLEXPRESS`, implementa validación de entrada con HTTP 400 Bad Request, añade el endpoint de categorías y asegura que la suite de pruebas pase al 100%."*
- **Qué generó la IA:**
  - Configuración de `DefaultConnection` en `appsettings.json` hacia `localhost\SQLEXPRESS` (`Bufalos_DB`).
  - Validación defensiva de campos en `UsuarioApi.cs` retornando `Results.BadRequest(...)` en lugar de una excepción 500.
  - Creación de `CategoriaApi.cs` con el endpoint `GET /api/v1/categorias`.
  - Implementación de `PUT /api/v1/productos/{id}` con validación de DTO en `ProductoApi.cs`.
- **Qué se aceptó:** Validación de entradas con código 400 y estructura JSON estandarizada.
- **Qué se corrigió y por qué:** Se ajustó Entity Framework para incluir `AsNoTracking()` en las consultas de solo lectura y se mejoró la paginación para calcular `totalPaginas` dinámicamente.

---

### Sesión 3: Ajustes de Seguridad en el Backend (CORS, Headers, Rate Limiting)
- **Prompt Utilizado:**
  > *"Configura en Program.cs y middlewares de BufalosAPI las directrices de seguridad requeridas: CORS restringido solo al frontend (localhost:5173 / localhost:3000), cabeceras de seguridad HTTP (X-Content-Type-Options, X-Frame-Options, HSTS, X-XSS-Protection), Rate Limiting en el login para prevenir fuerza bruta (OWASP API4) y normalización de errores 500 en ErrorAndLoggingMiddleware sin exponer ex.Message al exterior."*
- **Qué generó la IA:**
  - Configuración de `AddCors`, `AddRateLimiter` (`login-limiter`) y autorización basada en el rol `Administrador`.
  - Middleware `ErrorAndLoggingMiddleware.cs` con inyección de cabeceras HTTP y respuesta genérica JSON para errores 500.
- **Qué se aceptó:** El Rate Limiter nativo de ASP.NET Core y la mitigación de fuga de información.
- **Qué se corrigió y por qué (Corrección Crítica):** 
  - Inicialmente la IA colocó `app.UseHttpsRedirection()` antes de `app.UseCors(CorsPolicy)`.
  - Al ejecutar el login desde el frontend en `http://localhost:5173`, Kestrel emitía una redirección HTTP 307 hacia HTTPS sin las cabeceras CORS de respuesta, provocando un fallo de red (*CORS Network Error*) que en la interfaz se visualizaba como *"Ocurrió un error interno en el servidor"*.
  - **Corrección manual:** Se reordenó el pipeline ubicando `app.UseCors()` antes de cualquier redirección y se condicionó `UseHttpsRedirection()` para que en entorno de desarrollo (`Development`) no interfiera con llamadas locales de Vite.

---

### Sesión 4: Arquitectura Frontend, Accesibilidad y Cliente Centralizado
- **Prompt Utilizado:**
  > *"Scaffoldea una aplicación React + Vite + TypeScript en bufalos-frontend. Instala lucide-react para la galería de iconos (evitando degradados e iconos propios de IA), axios, react-router-dom, @tanstack/react-query, react-hook-form y zod. Diseña el cliente HTTP centralizado con interceptores que adjunten el token JWT, capturen errores 401 para redirección al login y normalicen 400/403/429. Diseña los componentes respetando WCAG 2.2 nivel AA (landmarks semánticos, labels, aria-describedby, aria-live, foco visible, controles >= 44x44 px y mobile-first desde 320 px)."*
- **Qué generó la IA:**
  - Estructura por capas: `components/`, `context/`, `pages/`, `services/`, `types/`.
  - `apiClient.ts` con interceptores de Axios y despacho del evento `auth:expired`.
  - Vistas principales: `LoginPage`, `CatalogoPage`, `ProductoDetallePage`, `AdminProductosPage`, `ProductoFormPage` y `AccesoDenegadoPage`.
  - Componentes accesibles `Modal` (trampa de foco y tecla Escape), `LoadingSpinner` y alertas.
- **Qué se aceptó:** La arquitectura por capas, el consumo desacoplado y el cumplimiento estricto de WCAG 2.2 AA.
- **Qué se corrigió y por qué:** Se reforzó el botón de cierre del modal y los inputs de formulario para asegurar que la superficie táctil supere los 44 × 44 px en dispositivos móviles.

---

### Sesión 5: Depuración y Saneamiento del Repositorio (Monorepo Limpio)
- **Prompt Utilizado:**
  > *"Reorganiza la estructura del proyecto, archivos duplicados y demás, para que el proyecto sea funcional, organizado e intuitivo."*
- **Diagnóstico Detectado:**
  - Descompresión anidada accidental del `.zip` original (`BufalosAPI/BufalosAPI/...`).
  - Archivos binarios de compilación (`obj/` y `bin/`) rastreados por Git debido a una errata en el `.gitignore` raíz (`[Ob]j/` en lugar de `[Oo]bj/`).
- **Qué se ejecutó y corrigió:**
  - Corrección de `.gitignore` para excluir de forma estricta `bin/`, `obj/`, `node_modules/`, `dist/` y `.env`.
  - Purga de la caché de Git sin alterar el código fuente.
  - Eliminación de subcarpetas redundantes duplicadas, dejando una estructura monorepo limpia de dos carpetas principales: `BufalosAPI/` (backend) y `bufalos-frontend/` (frontend).

---

### Sesión 6: Solución de Errores de Pruebas en Vitest y Node 26
- **Problema Reportado:**
  - En la consola aparecía el error `TypeError: Cannot read properties of undefined (reading 'config')` al ejecutar `vitest run`.
- **Causa Raíz:**
  - En la carpeta de pruebas se había incluido un script `polyfill.cjs` que interceptaba y sobreescribía métodos de `node:vm` (`runInContext` y `createContext`).
  - Al ejecutar Vitest en Node.js v26, esa sobreescritura alteraba los workers de Vitest, impidiendo que `describe()` accediera a su contexto interno.
- **Corrección manual aplicada:**
  - Se removió la importación de `polyfill.cjs` de `setup.ts`, aprovechando el soporte nativo completo de Node.js v26.
  - Se corrigió el script en `package.json` a `"test": "vitest run"` para funcionamiento nativo y multiplataforma.
  - Resultado: las 19 pruebas de componentes pasaron al 100%.

---

### Sesión 7: Integración Funcional de Tickets de Servicio Técnico y Pedidos
- **Prompt Utilizado:**
  > *"1. Interacción y Vista Detalle de Producto en el Catálogo: convierte la tarjeta en un elemento clickeable completo. Elimina el botón redundante 'Ficha Técnica'.*
  > *2. Ajuste de Permisos de Navegación por Rol: Rol Técnico con acceso a 3 páginas: Catálogo (/catalogo), Panel Técnico (/tecnico o /soporte) y Gestión de Inventario (/admin/productos o /inventario en consulta operativa sin mutaciones).*
  > *3. Flujo Completo de Pedidos: Cliente realiza pedidos con persistencia en SQL Server (TB_Pedidos, TB_DetallePedidos); sincronización inmediata con el Panel Técnico (despachos) y Panel Admin (facturación e historial comercial).*
  > *4. Tickets de Servicio Técnico: Cliente crea tickets con selector de especialidad y parches custom (TB_DetallesParchesCustom); Técnico actualiza estados, reasigna y registra bitácora."*
- **Qué generó la IA:**
  - Tarjetas clickeables con eventos de teclado (`Enter`/`Espacio`) y foco visible.
  - Modal de compra `CompraModal.tsx` con `e.stopPropagation()` para no forzar la navegación al abrirlo.
  - Endpoints en `PedidoApi.cs` y `ServicioTecnicoApi.cs`.
  - Vistas `ClientePanelPage.tsx`, `TecnicoPanelPage.tsx` y `AdminDashboardPage.tsx`.
- **Qué se aceptó:** La sincronización en tiempo real entre los 3 paneles mediante React Query.
- **Qué se corrigió y por qué:** Se normalizaron los nombres de estado en el backend para aceptar variantes con y sin acentos (*"En Reparación"* vs *"En Reparacion"*), evitando rechazos de validación.

---

### Sesión 8: Rediseño Visual, Sistema de Diseño Morado-Dorado y Accesibilidad
- **Prompt Utilizado:**
  > *"Realiza un rediseño UI/UX integral en la aplicación Búfalos Tactical, aplicando un nuevo sistema de diseño: fondos morado oscuro/noche (#0f0a1e, #140d28), acentos y bordes dorados (#f59e0b), textos blancos y contrastes estrictos WCAG AA. Homogeiniza Navbar, tarjetas de productos, tablas y paneles operativos."*
- **Qué generó la IA:**
  - Tokens temáticos en `src/index.css`.
  - Depuración de estilos antiguos (`slate-900`, etc.) reemplazados por el esquema noche/dorado.
  - Botones dorados (`bg-amber-500`) con texto oscuro (`text-night-950`) logrando contraste > 11:1 (nivel AAA).
- **Qué se aceptó:** Toda la homogeneización visual, manteniendo intacta la lógica de estado y llamadas a la API.

---

### Sesión 9: Registro Multi-Rol, Unificación Catálogo/Inventario, Modo Claro/Oscuro y Bitácora Plegable
- **Prompt Utilizado:**
  > *"1. Registro de Usuarios en Login: permite seleccionar rol (Cliente, Técnico, Administrador) y conectar con POST /api/v1/usuarios/registro.*
  > *2. Unificación de Catálogo e Inventario: fusiona en /catalogo con switch visual entre 'Galería' (4x) y 'Lista', restringiendo botones Editar y Eliminar solo al Administrador.*
  > *3. Tema Claro / Modo Oscuro: toggle en Navbar dinámico con persistencia y contraste WCAG AA.*
  > *4. Bitácora en Panel Técnico: muestra por defecto la nota más reciente con botón para desplegar u ocultar el historial completo."*
- **Qué generó la IA:**
  - Pestaña de registro en `LoginPage.tsx` con selector de roles.
  - Conmutador Galería/Lista en `CatalogoPage.tsx` con grilla de 4 columnas en desktop.
  - `ThemeContext.tsx` con inyección de `data-theme` y estilos de alto contraste para Modo Claro.
  - Acordeón colapsable para notas de bitácora en `TecnicoPanelPage.tsx`.
- **Qué se aceptó:** Todas las funcionalidades integradas, validadas con 5 nuevos tests en `NuevasFuncionalidades.test.tsx`.

---

### Sesión 10: Gestión de Imágenes de Productos y Simplificación de Switch
- **Prompt Utilizado:**
  > *"1. Remover cuadro 'CONTROL ADMINISTRADOR' en Catálogo y simplificar switch a 'Galería' y 'Lista'.*
  > *2. Gestión e Integración de Imágenes de Productos: soporte para URL, archivo local (FileReader) y presets tácticos; fallback de imagen táctica en ProductImage.tsx; modal de actualización rápida y persistencia con PUT /api/v1/productos/{id}."*
- **Qué generó la IA:**
  - Componente `ProductImage.tsx` con SVG táctico de reserva.
  - Modal `ActualizarImagenModal.tsx` integrado en Catálogo y Detalle.
  - Bloque de carga de imagen en `ProductoFormPage.tsx`.
- **Qué se aceptó:** La resiliencia visual (0 imágenes rotas) y la reactividad de actualización inmediata en React Query.

---

### Sesión 11: Auditoría del Esquema SQL (`Bufalos_DB`) e Integración Completa de Tablas Pendientes
- **Prompt Utilizado:**
  > *"Por favor, realiza la revisión completa del esquema de la base de datos SQL (`Bufalos_DB`) y asegúrate de integrar todas las tablas pendientes en el frontend (React + TypeScript) y backend (.NET 8):*
  > *1. Integración de Proveedores (`TB_Proveedores` y `TB_ProveedoresProductos`): Actualiza los formularios de creación y edición de productos, así como la vista de detalles del producto, para permitir seleccionar y asociar uno o varios proveedores al producto. Sincroniza los endpoints de la API y las consultas en EF Core para persistir y retornar la relación de proveedores en el catálogo.*
  > *2. Nueva Página de Gestión de Usuarios y Permisos (Exclusivo Administrador): Crea una nueva vista/página de administración (/admin/usuarios o integrada en el Panel Admin) donde el Administrador pueda visualizar el listado completo de todos los usuarios registrados. Permisos Especiales: Añade controles para otorgar o revocar permisos especiales a los usuarios, tales como autorización para comprar productos con restricción de edad o productos exclusivos para personal autorizado (Fuerzas de Orden / Seguridad). Estado de Cuenta (Baneo): Implementa la capacidad de banear / desactivar cuentas de usuario. Si un usuario baneado intenta iniciar sesión, el backend debe rechazar el acceso y el frontend debe mostrar una alerta clara (ej. 'Su cuenta ha sido suspendida/baneada').*
  > *3. Actualización de Historial de Servicios Técnicos para el Cliente: Sincroniza la vista de Servicios Técnicos del Rol Cliente para que utilice la misma estructura y lógica de listado de historial detallado (con sus respectivas notas de bitácora y seguimiento) que actualmente ya posee el Administrador.*
  > *4. Auditoría de Tablas Pendientes: Revisa todas las tablas de Bufalos_DB (incluyendo permisos de usuarios, detalles de parches custom, etc.) para garantizar que ninguna quede fuera de uso, integrando cualquier funcionalidad faltante en las pestañas existentes o creando nuevas secciones según corresponda."*
- **Qué generó la IA y cambios implementados:**
  - **Modelos y Mapeo Relacional EF Core:**
    - Mapeo Many-to-Many entre `Producto` y `Proveedor` a través de `TB_ProveedoresProductos` en `BufalosDbContext`.
    - Incorporación de `[JsonIgnore]` en `Proveedor.Productos` para erradicar ciclos de serialización JSON (`JsonException: A possible object cycle was detected`).
    - Mapeo íntegro de las 7 columnas de `TB_DetallesParchesCustom` en `ServicioTecnicoSeguimiento.cs` (`Id_DetalleParche`, `Id_OrdenServicio`, `TextoPersonalizado`, `Dimensiones`, `TipoBordado`, `Cantidad`, `ObservacionesDiseno`).
    - Configuración relacional con `TB_TiposServicio` (`TipoServicio.cs`).
  - **Endpoints Backend:**
    - Endpoints CRUD de proveedores en `ProductoApi.cs`: `GET /api/v1/proveedores`, `POST /api/v1/proveedores`, `PUT /api/v1/proveedores/{id}`, `DELETE /api/v1/proveedores/{id}`.
    - Endpoints de administración de usuarios en `UsuarioApi.cs`: `GET /api/v1/usuarios`, `PUT /api/v1/usuarios/{id}/estado` (conmutador de baneo/activación), `POST /api/v1/usuarios/{id}/permisos` (concesión de permisos especiales) y `DELETE /api/v1/usuarios/{id}/permisos/{permisoId}` (revocación).
    - Bloqueo en login para usuarios con `Activo == false`, respondiendo HTTP 403 Forbidden con mensaje explícito de suspensión.
    - Validación regulatoria en checkout (`PedidoApi.cs`): verificación de estado de cuenta, mayoría de edad (+18 años o permiso), licencias para personal autorizado (`SoloPersonalAutorizado`) y porte de armamento (`RequierePermiso`).
  - **Frontend (React + TypeScript):**
    - Nueva página **Usuarios y Permisos** (`/admin/usuarios`, componente `AdminUsuariosPage.tsx`, titulada *"Gestión de Usuarios y Permisos Especiales"*), visible en el Navbar superior para el Administrador, provista de enlace de retorno `← Volver al Panel Admin Master`, botón `Actualizar Lista`, 4 tarjetas KPI (Total Registrados, Cuentas Activas, Cuentas Baneadas, Con Permisos Especiales), filtros desplegables de rol y estado, buscador por nombre/correo, tarjetas con identificador `#UID-{id}`, badges temáticos, botón de baneo/reactivación y modal para otorgar licencias en `TB_PermisosUsuarios`.
    - Banner de alerta visual en `LoginPage.tsx` ante intentos de inicio de sesión con cuentas baneadas.
    - Selector múltiple de proveedores con información de contacto en `ProductoFormPage.tsx` y sección de "Cadena de Suministro y Proveedores Oficiales" en `ProductoDetallePage.tsx`.
    - Rediseño del panel de servicios técnicos del cliente (`ClientePanelPage.tsx`) homologando las tarjetas técnicas, indicador de nota reciente y drawer colapsable de bitácora histórica, junto al selector de `TB_TiposServicio` y campos para parches custom (`TB_DetallesParchesCustom`).
    - Incorporación de la suite de pruebas `AdminUsuariosYProveedores.test.tsx` (5 nuevos tests de componentes con Vitest).
- **Qué se aceptó:** La cobertura completa de las 12 tablas relacionales de la base de datos, el flujo de baneo y permisos especiales, y la homologación visual de la bitácora técnica para el cliente.
- **Qué se corrigió y por qué:** Se corrigió el ciclo de serialización en Entity Framework con `[JsonIgnore]` en proveedores y se integró un polyfill para jsdom en los tests de componentes para evitar advertencias de `Iterator` en Node.

---

### Sesión 12: Diagnóstico y Migración a .NET 10 (`net10.0`)
- **Problema Reportado:**
  - Al ejecutar `dotnet run` en un entorno donde solo está instalado .NET 10 (SDK 10.0.301 / Runtime 10.0.9), el proyecto configurado en `net8.0` fallaba por ausencia de `Microsoft.AspNetCore.App 8.0`.
- **Evaluación de Alternativas:**
  1. *Opción 1: `<RollForward>LatestMajor</RollForward>` manteniendo `net8.0`:*
     - Aunque permitía arrancar el ejecutable principal, al correr las pruebas de integración xUnit surgía una excepción binaria interna: `System.InvalidOperationException: The PipeWriter 'ResponseBodyPipeWriter' does not implement PipeWriter.UnflushedBytes`, debido a que el componente `TestServer` de `Microsoft.AspNetCore.Mvc.Testing 8.0` no implementa las interfaces esperadas por el motor `System.Text.Json` de .NET 10.
  2. *Opción 2: Migración nativa completa a `net10.0`:*
     - Se actualizó el `<TargetFramework>` a `net10.0` tanto en `BufalosAPI.csproj` como en `BufalosAPI.Tests.csproj`.
     - Se actualizaron las dependencias `Microsoft.AspNetCore.*`, `Microsoft.EntityFrameworkCore.*` y `Microsoft.AspNetCore.Mvc.Testing` a la versión estable **10.0.14**.
     - Se incorporó la referencia de seguridad `System.Security.Cryptography.Pkcs` (v10.0.14) para resolver advertencias de vulnerabilidades conocidas.
- **Decisión Final:** Se implementó y verificó la **Opción 2**. La compilación finalizó con 0 errores y 0 advertencias, y las 5 pruebas de integración xUnit pasaron exitosamente al 100%.

---

## 3. Resumen de Decisiones: Aceptado, Corregido y Descartado

| Aspecto | Qué se Aceptó | Qué se Corrigió Manualmente | Qué se Descartó |
|---|---|---|---|
| **Arquitectura de API** | Minimal APIs desacopladas por entidad y contratos DTO. | Subsanación de error 500 por contraseña vacía; implementación de PUT y categorías. | Controladores MVC pesados en favor de Minimal APIs livianas. |
| **Pipeline y Middleware** | Inyección de cabeceras de seguridad y Rate Limiting. | Reordenamiento: `UseCors` antes de `UseHttpsRedirection` para evitar preflight 307 sin cabeceras CORS. | Forzar redirección HTTPS en desarrollo local de Vite. |
| **Runtime y Framework** | Migración a .NET 10 con dependencias 10.0.14. | Solución al error de `ResponseBodyPipeWriter` en pruebas xUnit y parche de `System.Security.Cryptography.Pkcs`. | Mantener `RollForward: LatestMajor` sobre .NET 8 con dependencias obsoletas. |
| **Frontend y Estado** | React 19 con TanStack Query v5 y Axios centralizado. | Corrección de imports para `verbatimModuleSyntax: true` y remoción de `polyfill.cjs` incompatible con Node 26. | Uso de Redux o contextos monolíticos sobrecargados. |
| **Diseño y Accesibilidad** | Tokens temáticos morado-dorado, WCAG 2.2 AA y presets de imagen. | Ajuste de tamaños táctiles mínimos a >= 44x44 px y contraste superior a 7:1 en textos secundarios. | Degradados chillones, sombras excesivas e iconografía inventada por IA. |
| **Navegación e Inventario** | Unificación en `/catalogo` con toggle Galería 4x / Lista y permisos RBAC. | Ocultación total de botones de edición/eliminación para Cliente y Técnico; insignia operativa para Técnico. | Mantener dos vistas de inventario desconectadas en el Navbar. |

---

## 4. Estado de Verificación Final

- **Backend:** `dotnet test BufalosAPI.slnx` &rarr; **5/5 pruebas superadas (100%)**.
- **Frontend:** `npm test` &rarr; **19/19 pruebas superadas (100% en 5 suites)**.
- **Compilación de Producción:** `tsc -b && vite build` &rarr; **0 errores de tipado**.
- **Auditoría de Seguridad:** Dependencias del backend parcheadas a 10.0.14 y frontend documentado.
