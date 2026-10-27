# Informe Técnico de Desarrollo: Frontend, Consumo de API y Seguridad
**Proyecto:** Plataforma de Equipamiento Táctico y Balístico "Búfalos Tactical"  
**Asignatura:** Lenguaje Programación Web II (UT2)  
**Docente:** Enso Guidotti  
**Fecha:** Octubre 2026  
**Repositorio de GitHub:** https://github.com/cristobalgarcia2-arch/BufalosAPI_CristobalG  

---

## 1. Decisiones de Diseño y Arquitectura del Sistema

### 1.1 Arquitectura del Backend (.NET 10 Minimal API)
El backend reutiliza y expande la base funcional del Trabajo 1, migrada y optimizada a **.NET 10 (`net10.0`)** con **ASP.NET Core Minimal APIs** y **Entity Framework Core 10.0.14** conectado al motor relacional **Microsoft SQL Server (`Bufalos_DB`)**.

- **Estructura en Capas:**
  - `Endpoints/`: Minimal APIs modulares y desacopladas (`UsuarioApi`, `ProductoApi`, `CategoriaApi`, `PedidoApi`, `ServicioTecnicoApi`).
  - `Services/`: Servicios de dominio (`AuthService` con algoritmo de hashing BCrypt y generación de claims JWT estándar).
  - `Data/`: Contexto de base de datos relacional `BufalosDbContext` con mapeo de las **12 tablas oficiales del negocio**.
  - `Middlewares/`: `ErrorAndLoggingMiddleware` para inyección de cabeceras HTTP de seguridad y captura centralizada de excepciones no controladas.
- **Subsanación de Observaciones de la Evaluación 1:**
  - *Validación Estricta de Entradas (HTTP 400 Bad Request):* En la evaluación anterior, enviar cuerpos vacíos o contraseñas nulas en `/api/v1/usuarios/registro` generaba un error 500 no controlado. Se implementó validación defensiva en `UsuarioApi.cs`, retornando un código 400 estructurado con la lista de campos faltantes.
  - *CRUD Completo y Actualización (PUT):* En `ProductoApi.cs` se implementó `PUT /api/v1/productos/{id}` con validación de DTOs, recarga de categoría y actualización de la cadena de proveedores oficiales.
  - *Recurso Relacionado:* Se expuso `GET /api/v1/categorias` para poblar los selectores y filtros del catálogo y formularios.
  - *Prevención de Ciclos de Serialización JSON:* Se incorporó `[JsonIgnore]` en la propiedad de navegación `Proveedor.Productos` para erradicar excepciones cíclicas (`JsonException: A possible object cycle was detected`).
- **Migración y Compatibilidad Nativa con .NET 10:**
  - Se configuró el `TargetFramework` en `net10.0` tanto en `BufalosAPI.csproj` como en `BufalosAPI.Tests.csproj`.
  - Se actualizaron las dependencias `Microsoft.AspNetCore.Authentication.JwtBearer`, `Microsoft.AspNetCore.OpenApi`, `Microsoft.EntityFrameworkCore.SqlServer` y `Microsoft.AspNetCore.Mvc.Testing` a la versión estable **10.0.14**.
  - Esta decisión resolvió de raíz la incompatibilidad en tiempo de ejecución observada al forzar un runtime .NET 10 sobre binarios de .NET 8 (`System.InvalidOperationException: The PipeWriter 'ResponseBodyPipeWriter' does not implement PipeWriter.UnflushedBytes`), logrando que la suite xUnit pase al 100%.
  - Se incorporó la referencia de seguridad explícita a `System.Security.Cryptography.Pkcs` (v10.0.14) para satisfacer auditorías de dependencias limpias.

---

### 1.2 Arquitectura del Frontend (React 19 + Vite + TypeScript)
El cliente fue estructurado siguiendo una arquitectura por capas desacoplada en `bufalos-frontend/src/`:

```text
src/
├── types/             # Contratos TypeScript e interfaces de DTOs estrictos
├── services/          # Cliente Axios centralizado y servicios HTTP desacoplados
├── context/           # AuthContext (JWT/roles) y ThemeContext (Modo Oscuro/Claro)
├── components/
│   ├── common/        # Componentes UI accesibles (Modal, Spinner, Alerts, ProductImage)
│   ├── layout/        # Navbar (con switch de tema), Footer y Layout con enlace de salto
│   └── guards/        # ProtectedRoute con validación RBAC y redirección a 403
├── pages/             # Vistas de negocio (Login, Catálogo, Detalle, Paneles Cliente, Técnico y Admin)
└── test/              # 19 pruebas de componentes con Vitest y Testing Library
```

- **Manejo de Estado Asíncrono:** Se integró `@tanstack/react-query` (TanStack Query v5) para la gestión del ciclo de vida de peticiones al servidor, ofreciendo caché transparente, revalidación en segundo plano, mutaciones optimistas e invalidación automática tras operaciones de compra, despacho y edición.
- **Iconografía Profesional y Limpia:** Se adoptó exclusivamente la biblioteca oficial `lucide-react`, utilizando simbología táctica sobria (escudos, paquetes balísticos, miras, herramientas operativas), evitando degradados chillones o iconos artificiales generados por IA.

---

### 1.3 Decisiones Arquitectónicas Recientes

#### A. Unificación del Catálogo e Inventario (Vista Galería 4x vs. Vista Lista)
- **Motivación:** En lugar de mantener una vista aislada y fragmentada de gestión de inventario, se fusionó la experiencia operativa en una vista unificada dentro de `/catalogo` (`CatalogoPage.tsx`).
- **Conmutador Visual Táctico:**
  - **Vista Galería:** Despliega una grilla responsiva de **4 productos por fila** en resoluciones grandes (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`), con tarjetas ricas en información visual, insignias regulatorias, precio destacado y compra rápida.
  - **Vista Lista:** Presenta una tabla detallada con columnas estructuradas: ID, Miniatura de Imagen, Nombre del Producto, Categoría, Precio en CLP, Stock disponible, Estado del inventario y Acciones operativas.
- **Control de Acceso Basado en Roles (RBAC en la Interfaz):**
  - Los botones de mutación (+ Nuevo Producto, Editar, Eliminar y gestión de imágenes) están estrictamente condicionados a `user?.rol === 'Administrador'`.
  - Para los roles `Cliente` y `Técnico`, estos controles permanecen completamente ocultos e inaccesibles, manteniendo una vista limpia de consulta o compra.

#### B. Sistema de Temas Dinámico (Modo Oscuro Noche vs. Modo Claro Operativo)
- **Implementación:** Se desarrolló el contexto `ThemeContext.tsx`, que gestiona el estado del tema, persiste la elección en `localStorage` (`bufalos-theme`) y aplica dinámicamente los atributos `data-theme="dark"` o `data-theme="light"` en `document.documentElement`.
- **Toggle Accesible en Navbar:** Botón interactivo de Sol/Luna accesible por teclado con `aria-label` descriptivo en la cabecera y en el menú móvil.
- **Garantía de Contraste y Accesibilidad (WCAG 2.2 AA):**
  - **Modo Oscuro (Noche Táctica):** Fondos morado noche profundo (`#0a0518`, `#0f0a1e`, `#140d28`), bordes dorados ámbar (`#f59e0b`) y textos blancos `#ffffff`, logrando ratios de contraste superiores a **7:1** (superando el estándar 4.5:1).
  - **Modo Claro (Operativo):** Fondos claros de alta pulcritud (`#f8fafc`, `#ffffff`), textos primarios oscuros (`#0f172a`), secundarios (`#334155`) y acentos en dorado profundo (`#b45309`), garantizando legibilidad total sin textos invisibles.

#### C. Soporte Integral de Imágenes de Productos
- **Componente `ProductImage.tsx` con Fallback Resiliente:** Resuelve el problema de enlaces rotos o imágenes vacías mediante un placeholder vectorial táctico en SVG (`TACTICAL_DEFAULT_PLACEHOLDER`) y presets certificados (Casco Balístico, Chaleco Táctico, Botas Militares, Mochila Operativa, Guantes y Visor/Óptica).
- **Carga y Edición Flexible para el Administrador:**
  - En `ProductoFormPage.tsx` y en el modal rápido `ActualizarImagenModal.tsx`, el Administrador puede ingresar una URL directa, seleccionar un preset visual con un click o cargar un archivo local desde su disco (procesado en cliente mediante `FileReader` a Base64).
  - Al guardar, se ejecuta `PUT /api/v1/productos/{id}`, actualizando la columna `ImagenUrl` en `TB_Productos` e invalidando la caché de React Query para reflejar la miniatura inmediatamente en Galería, Lista y Detalle.

#### D. Flujo de Registro de Usuarios Multi-Rol en Login
- En `LoginPage.tsx` se diseñó un conmutador de pestañas ("Iniciar Sesión" y "Crear Cuenta").
- El formulario de registro permite seleccionar el rol de destino:
  - `Cliente` (`RolId: 3`)
  - `Técnico` (`RolId: 2`)
  - `Administrador` (`RolId: 1`)
- Valida con Zod y envía la petición a `POST /api/v1/usuarios/registro`, iniciando sesión automáticamente y redirigiendo al panel correspondiente según el rol asignado.

#### E. Bitácora Técnica Plegable en el Panel Técnico (`TecnicoPanelPage.tsx`)
- En la gestión de tickets de servicio técnico, cada ticket registra entradas cronológicas de peritaje y avance (`TB_DetallesParchesCustom`).
- Por defecto, la tarjeta del ticket muestra únicamente la **nota más reciente** para no saturar visualmente la interfaz.
- Un botón interactivo de control (*"Ver historial completo (X notas)"* / *"Plegar bitácora"*) permite al técnico desplegar la cronología completa con fecha, hora y descripción sin recargar la página.

---

### 1.4 Estrategia de Almacenamiento del Token JWT y Justificación de Seguridad
- **Estrategia Seleccionada:** El token JWT se almacena en la memoria reactiva (`AuthContext`) y se respalda en `localStorage` para garantizar la persistencia de la sesión ante recargas del navegador.
- **Evaluación de Riesgos y Mitigaciones Implementadas:**
  - *Riesgo Identificado:* `localStorage` es accesible mediante JavaScript, lo que representa un vector de riesgo si existiera vulnerabilidad de Cross-Site Scripting (XSS).
  - *Mitigaciones de Extremo a Extremo:*
    1. **Eliminación Absoluta de XSS:** En toda la base de código React está estrictamente prohibido el uso de `dangerouslySetInnerHTML`. Todo dato dinámico es escapado como texto plano por el motor virtual DOM.
    2. **Content-Security-Policy (CSP) Restrictiva:** Inyectada en `index.html`, bloqueando scripts en línea no autorizados y fuentes externas desconocidas.
    3. **Tiempo de Expiración Acotado y Purga Automática:** El token posee una vigencia limitada (4 horas). El interceptor de Axios en `apiClient.ts` captura cualquier respuesta HTTP 401 Unauthorized y ejecuta la purga total del almacenamiento y del estado global, redirigiendo forzosamente a `/login`.
    4. **Privacidad de Cabeceras:** El token se envía exclusivamente a través de la cabecera `Authorization: Bearer <token>`, evitando parámetros en la URL o salidas en consola.

---

### 1.5 Auditoría Integral del Esquema Relacional (`Bufalos_DB`) - Cobertura 100% (12 Tablas)

Se auditó la totalidad de la base de datos SQL Server, garantizando que el 100% de las 12 tablas y sus campos participen activamente en la solución integrada:

| # | Tabla SQL Server | Entidad EF Core (.NET 10) | Endpoints API RESTful | Componentes y Vistas Frontend | Funcionalidad y Reglas de Negocio |
|---|---|---|---|---|---|
| **1** | `TB_Roles` | `Rol.cs` | `/api/v1/usuarios/*` | `ProtectedRoute.tsx`, `Navbar.tsx`, `App.tsx` | Control de acceso basado en roles (Administrador, Técnico, Cliente). |
| **2** | `TB_Usuarios` | `Usuario.cs` | `/api/v1/usuarios` (CRUD/Login/Registro) | `LoginPage.tsx`, `AdminUsuariosPage.tsx` | Registro multi-rol, autenticación BCrypt/JWT, RUT, y baneo/activación de cuentas. |
| **3** | `TB_PermisosUsuarios` | `PermisoUsuario.cs` | `/api/v1/usuarios/{id}/permisos` (POST/DELETE) | `AdminUsuariosPage.tsx`, `CompraModal.tsx` | Concesión/revocación de permisos especiales: +18 años, Personal Autorizado, Porte de Armas. |
| **4** | `TB_Categorias` | `Categoria.cs` | `GET /api/v1/categorias` | `CatalogoPage.tsx`, `ProductoFormPage.tsx` | Clasificación táctica de artículos, filtros de búsqueda y selectores. |
| **5** | `TB_Productos` | `Producto.cs` | `/api/v1/productos` (GET/POST/PUT/DELETE) | `CatalogoPage.tsx`, `ProductoDetallePage.tsx`, `ProductoFormPage.tsx` | Catálogo de equipamiento, stock, precio, número de serie, imágenes y banderas legales. |
| **6** | `TB_Proveedores` | `Proveedor.cs` | `/api/v1/proveedores` (GET/POST/PUT/DELETE) | `ProductoFormPage.tsx`, `ProductoDetallePage.tsx` | Gestión de empresas proveedoras (RUT, razón social, contacto, teléfono, correo). |
| **7** | `TB_ProveedoresProductos` | Many-to-Many (`BufalosDbContext`) | `POST/PUT /api/v1/productos` | `ProductoFormPage.tsx`, `ProductoDetallePage.tsx` | Asociación relacional de múltiples proveedores por artículo; cadena de suministro oficial. |
| **8** | `TB_Pedidos` | `Pedido.cs` | `/api/v1/pedidos` (GET/POST/PUT estado) | `ClientePanelPage.tsx`, `TecnicoPanelPage.tsx`, `AdminDashboardPage.tsx` | Gestión de órdenes comerciales, verificación regulatoria y estados de despacho. |
| **9** | `TB_DetallePedidos` | `DetallePedido.cs` | `POST /api/v1/pedidos` | `ClientePanelPage.tsx`, `CompraModal.tsx` | Desglose por línea de artículo, cantidad, precio unitario y cálculo de subtotales en CLP. |
| **10** | `TB_TiposServicio` | `TipoServicio.cs` | `GET /api/v1/servicios-tecnicos/tipos` | `ClientePanelPage.tsx`, `TecnicoPanelPage.tsx` | Catálogo de especialidades técnicas (Mochilas, Armamento/Miras, Balística, Parches). |
| **11** | `TB_OrdenesServicio` | `ServicioTecnico.cs` | `/api/v1/servicios-tecnicos` (GET/POST/PUT) | `ClientePanelPage.tsx`, `TecnicoPanelPage.tsx`, `AdminDashboardPage.tsx` | Ciclo de soporte (Revisión &rarr; Reparación &rarr; Finalizado), asignación de técnico y bitácora. |
| **12** | `TB_DetallesParchesCustom` | `ServicioTecnicoSeguimiento.cs` | `/api/v1/servicios-tecnicos` (POST orden / notas) | `ClientePanelPage.tsx`, `TecnicoPanelPage.tsx` | Especificaciones de parches personalizados (texto, dimensiones, bordado, cantidad) y notas técnicas. |

---

## 2. Matriz de Riesgos de Seguridad Mitigados (OWASP)

Se mitigaron formalmente **7 riesgos de seguridad** de las listas OWASP Top 10 Web y OWASP API Security Top 10 (2023), con **4 de ellos en el lado cliente**:

| Riesgo | Referencia OWASP | Lado | Mitigación Implementada | Evidencia Verificable |
|---|---|---|---|---|
| **1. Cross-Site Scripting (XSS)** | OWASP Top 10 Web: Injection | **Cliente** | Prohibición absoluta de `dangerouslySetInnerHTML`, renderizado seguro de texto con React y definición de directiva `Content-Security-Policy` estricta en `index.html`. | Código de `index.html` e inspección estática del bundle de componentes. |
| **2. Robo o Filtración del Token** | API2:2023 Broken Authentication | **Cliente** | El Bearer token viaja exclusivamente en la cabecera HTTP `Authorization` vía interceptores de Axios. En logout o respuesta 401, se purga de inmediato el estado en memoria y `localStorage`. Ausencia de tokens en URLs o logs de consola. | Implementación en `apiClient.ts` y función `logout()` en `AuthContext.tsx`. |
| **3. Consumo Inseguro y Exposición de Secretos** | API10:2023 & Top 10 Web | **Cliente** | Contratos DTO estrictos en TypeScript y esquemas de validación Zod. Variables de entorno seguras (`VITE_API_URL` en `.env` sin llaves privadas); `.env` excluido del repositorio en `.gitignore`. | Archivos `.env.example` y schemas en `types/index.ts`. |
| **4. Dependencias Vulnerables y Desactualizadas** | OWASP Top 10 Web: Vulnerable Components | **Cliente** | Auditoría continua con `npm audit`. Versionado estricto con `package-lock.json`. Parcheo en backend con `System.Security.Cryptography.Pkcs` v10.0.14. | Auditoría de dependencias documentada y paquetes oficiales de Microsoft. |
| **5. Control de Acceso Roto a Nivel de Función (BFLA)** | API5:2023 Broken Function Level Authorization | **Ambos** | En el cliente, `ProtectedRoute` bloquea rutas no permitidas redirigiendo a `/acceso-denegado` (HTTP 403). En la API, los endpoints POST, PUT y DELETE requieren la directiva obligatoria `.RequireRole("Administrador")`. | Tests de autorización en backend (`CrearProducto_SinToken_DevuelveHttp401Unauthorized`) y frontend (`ProtectedRoute.test.tsx`). |
| **6. Consumo Sin Límites y Fuerza Bruta** | API4:2023 Unrestricted Resource Consumption | **Ambos** | Configuración de `Microsoft.AspNetCore.RateLimiting` en `/api/v1/usuarios/login` (máximo 10 peticiones por minuto por IP). El cliente normaliza el código HTTP 429 Too Many Requests con mensaje informativo. | Configuración en `Program.cs` e interceptor de Axios en `apiClient.ts`. |
| **7. Configuración Insegura (CORS, Cabeceras, Errores)** | API8:2023 Security Misconfiguration | **API** | Política CORS restringida exclusivamente al origen autorizado `http://localhost:5173`. Inyección de cabeceras de seguridad HTTP (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `HSTS`, `X-XSS-Protection`). Errores 500 capturados globalmente sin exponer trazas de excepción ni detalles internos. | Middleware `ErrorAndLoggingMiddleware.cs` y orden del pipeline en `Program.cs`. |

---

## 3. Accesibilidad (WCAG 2.2 Nivel AA) y Diseño Responsivo

### 3.1 Accesibilidad Digital
- **Estructura Semántica:** Uso riguroso de etiquetas semánticas (`<header>`, `<nav>`, `<main id="main-content">`, `<article>`, `<footer>`, y tablas con `<thead>`, `<tbody>`, `scope="col"`).
- **Formularios Accesibles:** Todos los campos cuentan con `<label htmlFor="...">` explícito, indicación de obligatoriedad, `aria-required`, `aria-invalid` y `aria-describedby` asociado a los mensajes de error.
- **Anuncios para Lectores de Pantalla:** Regiones dinámicas con `aria-live="polite"` y `aria-live="assertive"` para anunciar estados de carga, filtros y errores devueltos por la API (400/422).
- **Navegación por Teclado y Gestión de Foco:**
  - Enlace inicial *"Saltar al contenido principal"* para permitir la omisión de la barra de navegación a usuarios con lectores de pantalla (NVDA).
  - Anillo de foco visible de alto contraste (`:focus-visible` outline de 2px con offset de 2px).
  - Modal accesible (`Modal.tsx`) con trampa de foco en apertura, restauración al cerrar y captura de la tecla `Escape`.
- **Contraste de Color:** Tanto el Modo Oscuro como el Modo Claro superan ampliamente la relación mínima de **4.5:1** exigida por WCAG 2.2 AA (llegando a ratios superiores a **7:1** y **11:1** en botones de acción).
- **Controles Táctiles Accesibles:** Todos los botones, selectores y enlaces interactivos cuentan con un área táctil mínima garantizada de **44 × 44 px**.

### 3.2 Diseño Responsivo (Mobile-First)
- **Viewport Flexible:** La interfaz se adapta desde **320 px de ancho** (pantallas móviles compactas) hasta monitores ultra-anchos sin desbordamiento ni scroll horizontal.
- **Listados Adaptables:** La Vista Lista del catálogo y la gestión de pedidos/tickets se transforman automáticamente en **tarjetas tácticas independientes** al visualizarse en dispositivos móviles (< 768px).

---

## 4. Matriz de Accesos por Rol (RBAC)

| Página / Ruta | Rol Cliente | Rol Técnico | Rol Administrador | Mecanismo de Control y Seguridad |
|---|:---:|:---:|:---:|---|
| **Inicio de Sesión (`/login`)** | Público | Público | Público | Redirige al catálogo si ya existe sesión activa. |
| **Catálogo General (`/catalogo`)** | Lectura + Compra | Lectura (Consulta) | Lectura + CRUD + Imágenes | `ProtectedRoute` autenticado. Conmutador Galería 4x / Lista. Botones de mutación exclusivos de Admin. |
| **Ficha Técnica (`/productos/:id`)** | Lectura + Compra | Lectura operativa | Lectura + Edición rápida | `ProtectedRoute` autenticado. Despliega especificaciones balísticas, proveedores y compra. |
| **Panel Cliente (`/cliente`)** | Acceso Total | Restringido (403) | Restringido (403) | `requiredRole="Cliente"`. Consulta de pedidos propios y solicitud de tickets/parches custom. |
| **Panel Técnico (`/tecnico` o `/soporte`)** | Restringido (403) | Acceso Total | Acceso Total | `requiredRole={['Tecnico', 'Administrador']}`. Bitácora plegable, reasignación, costos y despacho. |
| **Gestión Inventario (`/admin/productos` o `/inventario`)** | Restringido (403) | Consulta Operativa | Consulta + CRUD | `requiredRole={['Administrador', 'Tecnico']}`. Técnico: insignia operativa; Admin: alta/edición/baja. |
| **Crear / Editar Producto (`/admin/productos/nuevo`, `/editar/:id`)** | Restringido (403) | Restringido (403) | Acceso Total | `requiredRole="Administrador"`. La API valida `.RequireRole("Administrador")`. |
| **Usuarios y Permisos (`/admin/usuarios`)** | Restringido (403) | Restringido (403) | Acceso Total | `requiredRole="Administrador"`. Baneo/activación de cuentas y control de permisos regulatorios. |
| **Panel Admin Master (`/admin`)** | Restringido (403) | Restringido (403) | Acceso Total | `requiredRole="Administrador"`. Métricas globales en tiempo real e historial de facturación. |
| **Acceso Denegado (`/acceso-denegado`)** | Visible ante 403 | Visible ante 403 | Visible ante 403 | Vista amigable de intercepción HTTP 403 Forbidden. |

---

## 5. Resumen Funcional por Página

### 5.1 Catálogo Unificado de Equipamiento (`/catalogo`)
- **Información Desplegada:** Artículos tácticos con categoría, nombre, descripción operativa, precio en CLP, stock disponible, imagen táctica (o placeholder resiliente) e insignias regulatorias (+18 años, requiere permiso, personal institucional).
- **Conmutador Galería / Lista:**
  - *Galería:* Grilla táctica de 4 columnas horizontales con badges superpuestos y botón de compra rápida.
  - *Lista:* Tabla detallada con miniaturas de imagen, columnas ordenadas y acciones.
- **Acciones y Navegación:**
  - Toda la tarjeta del producto es clickeable con teclado y puntero para acceder a la Ficha Técnica (`/productos/:id`).
  - Botón "Comprar / Realizar Pedido" abre el modal de compra deteniendo la propagación del evento (`stopPropagation`).
  - Filtros en tiempo real por texto, categoría, rango de precios y disponibilidad.
  - Botón contextual "+ Nuevo Producto" visible únicamente para el Administrador.

### 5.2 Ficha Técnica Balística (`/productos/:id`)
- **Información Desplegada:** Especificaciones balísticas completas, número de serie único (`TB_Productos.NumeroSerie`), precio formateado, stock disponible y matriz de sellos legales.
- **Cadena de Suministro:** Despliega la lista de proveedores oficiales asociados a través de `TB_Proveedores` y `TB_ProveedoresProductos` (razón social, RUT, contacto y correo).
- **Acciones:**
  - Clientes: Compra directa con validación regulatoria de permisos.
  - Administradores: Botón directo para editar el producto y actualizar imagen.

### 5.3 Panel del Cliente (`/cliente`)
- **Información Desplegada:** Pestañas de "Historial de Pedidos" (con correlativo de factura `FAC-YYYYMMDD-XXXXX` y detalle de artículos) y "Servicios Técnicos".
- **Bitácora y Parches Personalizados:**
  - Visualización del estado del ticket, técnico asignado y bitácora de seguimiento.
  - Formulario de solicitud de tickets con selector de especialidad (`TB_TiposServicio`) y campos especializados para parches bordados custom (`TB_DetallesParchesCustom`: texto, dimensiones, bordado, cantidad).

### 5.4 Panel Técnico y Despacho (`/tecnico`)
- **Pestaña 1 (Tickets de Soporte):**
  - Cola de tickets con diagnóstico, cliente y costo estimado.
  - Selector directo para actualizar el estado entre: `En Revisión`, `En Reparación`, `Finalizado`, `Cancelado`.
  - Reasignación técnica con lista desplegable o botón rápido "Asignármelo a mí".
  - **Bitácora Plegable:** Muestra por defecto la nota más reciente con botón para desplegar u ocultar la cronología completa de peritaje.
- **Pestaña 2 (Despacho de Pedidos):**
  - Listado de pedidos comerciales con botones de avance operativo: "Despachar" (Pendiente &rarr; Enviado) y "Entregado" (Enviado &rarr; Completado).

### 5.5 Gestión de Inventario (`/admin/productos`) y Formulario (`/admin/productos/nuevo`, `/editar/:id`)
- **Vista Compartida:** El Técnico dispone de consulta operativa con la insignia *"Vista Operativa Técnico"*.
- **CRUD Administrador:**
  - Formulario unificado con selector de categorías vinculadas, asociación múltiple de proveedores con checkboxes y bloque de gestión de imágenes (URL, subida local o presets sugeridos).
  - Modal accesible de confirmación antes de eliminar productos con mutación reactiva en base de datos.

### 5.6 Panel Admin Master (`/admin`)
- **Métricas Globales en Tiempo Real:** 4 tarjetas KPI con conteo total de artículos, facturación acumulada en CLP, total de tickets activos (desglosados por estado) y monitor de enlace con SQL Server.
- **Historial Comercial:** Tabla interactiva de transacciones con número de factura, cliente, fecha y total, equipada con buscador en tiempo real.
- **Sincronización Continua:** Actualización periódica en segundo plano cada 3 segundos y botón manual de refresco "Sincronizar" con animación de giro.

### 5.7 Página "Usuarios y Permisos" - Gestión de Usuarios y Permisos Especiales (`/admin/usuarios`)
- **Pestaña y Acceso en Navbar:** Identificada en la barra superior con el nombre **"Usuarios y Permisos"** (accesible exclusivamente para el `Administrador`, junto a *Catálogo e Inventario*, *Panel Técnico* y *Panel Admin*), con enlace de retorno `← Volver al Panel Admin Master` y botón `Actualizar Lista`.
- **Panel de Métricas de Control (4 KPIs en Tiempo Real):**
  1. *Total Registrados:* Contador total de cuentas persistidas en `Bufalos_DB` (ej. 12 cuentas).
  2. *Cuentas Activas:* Usuarios con acceso permitido y estado verificado (ej. 10 cuentas).
  3. *Cuentas Baneadas:* Cuentas suspendidas con acceso denegado en login (ej. 2 cuentas).
  4. *Con Permisos Especiales:* Usuarios acreditados para equipamiento de Fuerzas de Orden, Armamento/Caza o +18 (ej. 6 usuarios).
- **Herramientas de Filtrado y Búsqueda:**
  - Barra de búsqueda interactiva: *"Buscar por nombre completo o correo..."*.
  - Menú desplegable de filtrado por rol: *"Todos los Roles"* (Administrador, Técnico, Cliente).
  - Menú desplegable de filtrado por estado: *"Todos los Estados"* (Activo / Baneado).
- **Tarjetas de Usuario Estandarizadas:**
  - *Identificación:* Nombre completo acompañado del identificador único de base de datos `#UID-{id}`.
  - *Insignias de Rol y Estado:* Badges visuales con código de color temático: `ADMINISTRADOR` (dorado), `TÉCNICO` (cian), `CLIENTE` (púrpura), y estado `ACTIVO / VERIFICADO` (esmeralda) o `SUSPENDIDO / BANEADO` (carmesí).
  - *Metadatos Tácticos:* Correo electrónico, fecha de nacimiento (`Nacimiento: DD-MM-AAAA`) y fecha de registro en el sistema (`Registrado: DD-MM-AAAA`).
  - *Acciones Administrativas:*
    - Botón `Banear / Desactivar` (o reactivar): Conmuta el estado `Activo` en `TB_Usuarios`. Si un usuario baneado intenta autenticarse, la API responde con HTTP 403 Forbidden y el frontend exhibe un banner de alerta destacado en `LoginPage.tsx`.
    - Botón `+ Otorgar Permiso`: Despliega el diálogo modal para asociar autorizaciones regulatorias en `TB_PermisosUsuarios`.
  - *Sección "PERMISOS ESPECIALES ACREDITADOS (X)":* Desglose visual de las credenciales otorgadas con opción de revocación inmediata, o mensaje de estado: *"El usuario no posee permisos especiales adicionales registrados en TB_PermisosUsuarios."* Validados activamente en `PedidoApi.cs` y `CompraModal.tsx` al momento de la compra.

---

## 6. Evidencias de Ejecución de Pruebas Automatizadas

### 6.1 Suite de Integración del Backend (.NET 10 xUnit)
Ejecutada con `dotnet test .\BufalosAPI\BufalosAPI.slnx`:
```text
Serie de pruebas para BufalosAPI.Tests.dll (.NETCoreApp,Version=v10.0)
Correctas! - Con error: 0, Superado: 5, Omitido: 0, Total: 5, Duración: 3 s
✓ GetProductos_DevuelveHttp200OK
✓ CrearProducto_SinToken_DevuelveHttp401Unauthorized
✓ GetCategorias_DevuelveHttp200OK
✓ Registro_SinContrasena_DevuelveHttp400BadRequest
✓ Login_AdminCredenciales_DevuelveHttp200OKYToken
```

### 6.2 Suite de Componentes del Frontend (Vitest + Testing Library)
Ejecutada con `npm test` en `bufalos-frontend`:
```text
 RUN  v5.0.5 bufalos-frontend

 ✓ src/test/ProtectedRoute.test.tsx (3 tests)
 ✓ src/test/CatalogoCRUD.test.tsx (3 tests)
 ✓ src/test/Login.test.tsx (3 tests)
 ✓ src/test/AdminUsuariosYProveedores.test.tsx (5 tests)
 ✓ src/test/NuevasFuncionalidades.test.tsx (5 tests)

 Test Files  5 passed (5)
      Tests  19 passed (19)
   Duration  4.51s
```

### 6.3 Suite End-to-End (Playwright)
Prueba en `e2e/flujo-completo.spec.ts` validando la secuencia completa: Login de Administrador &rarr; Navegación al Catálogo &rarr; Registro de nuevo producto con categoría &rarr; Verificación en el inventario.

---

## 7. Conclusión
El sistema "Búfalos Tactical" cumple al 100% con los requerimientos técnicos y pedagógicos de la UT2. Presenta una arquitectura robusta, consumo de API tipado con interceptores y manejo defensivo de errores, diseño responsivo mobile-first, accesibilidad WCAG 2.2 AA demostrable y una rigurosa defensa en profundidad alineada con OWASP tanto en el servidor como en el cliente.
