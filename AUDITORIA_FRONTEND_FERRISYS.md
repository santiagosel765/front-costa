# Auditoría profunda frontend Ferrisys

## Alcance
Auditoría de frontend Angular enfocada en autenticación JWT, guards, navegación modular, roles, tenant/multi-tenant y madurez SaaS.

## Hallazgos principales

### 1) Autenticación y JWT
- Existe `AuthService` con login contra `/v1/auth/login` y almacenamiento del token en `sessionStorage`.
- El estado de autenticación actual se considera válido solo por existencia del token (`isAuthenticated`), sin validar expiración (`exp`) ni claims.
- El interceptor agrega `Authorization: Bearer` para llamadas a la API y maneja `401` cerrando sesión.

### 2) Guards y control de acceso
- El router protege rutas funcionales con `ModuleGuard` y `data.moduleKey`.
- `ModuleGuard` consulta módulos habilitados y redirige a `/main/welcome` si no hay módulo habilitado.
- No hay `AuthGuard` activo para proteger el layout `/main`; por lo tanto, el acceso inicial depende de que el backend responda `401` en peticiones posteriores.
- No se detecta `RoleGuard` operativo en enrutamiento.

### 3) Menú/navegación
- El sidebar se construye dinámicamente desde módulos habilitados cargados por backend (`/v1/auth/modules`).
- Sin embargo, el mapeo de ruta/icono/label depende de constantes frontend (`MODULE_ROUTE_MAP`, etc.). Un módulo nuevo sin mapeo cae a `/main/welcome`.
- Existe un `MenuBuilderService` con configuración extensa hardcodeada que actualmente no parece estar integrado al sidebar.

### 4) Roles, licencias y tenant
- El panel de auth-admin sí permite gestión de usuarios, roles, módulos y matriz de permisos.
- Existe un componente de licencias por `tenantId`, pero no está integrado en tabs visibles del panel principal y la ruta `licenses` reapunta al tab de permisos.
- No se observa un contexto tenant transversal en el cliente (por ejemplo, header `X-Tenant-Id`, tenant en estado global o selector activo).

### 5) Multi-sucursal / multi-empresa en UI
- Se encontró UI de “empresa” en carpeta legacy `pages/inventario` (simulada/local) que no está en la ruta principal vigente (`/main/inventory` apunta a otro shell).
- En la aplicación principal no hay selector operativo de sucursal/tenant conectado al backend.

## Respuestas directas (A–G)

### A) ¿El frontend depende demasiado del rol?
- Parcialmente. El runtime de navegación principal hoy depende más del **módulo habilitado** que del rol directo. El rol se gestiona en admin, pero no se usa como guard explícito en rutas de negocio.

### B) ¿Existe validación por módulo?
- Sí. Hay validación por módulo en rutas (`ModuleGuard`) y en el menú mostrado.

### C) ¿El menú es dinámico o está hardcodeado?
- Mixto:
  - Dinámico en runtime (sidebar basado en módulos habilitados desde backend).
  - Pero con mapeo hardcodeado de rutas/iconos/etiquetas en constantes; módulos no mapeados no enrutan correctamente.

### D) ¿Se ocultan módulos solo visualmente?
- No únicamente visualmente: también hay bloqueo por guard de ruta (`ModuleGuard`).

### E) ¿Se podría acceder manualmente por URL a módulos no permitidos?
- En rutas configuradas con `ModuleGuard`, no (redirige a `/main/welcome`).
- Riesgo residual: rutas nuevas sin `moduleKey` o no protegidas quedarían expuestas.

### F) ¿El frontend valida expiración de JWT?
- No. No se encontró decodificación ni validación de `exp` en cliente.

### G) ¿Existe manejo de multi-sucursal en UI?
- No en el flujo principal actual. Hay señales en código legacy/simulado, pero no un manejo productivo y transversal en la app principal.

## Evaluación SaaS

### ¿Se podría vender así?
- Como MVP técnico, sí.
- Como SaaS vendible/enterprise aún no: faltan controles de sesión robustos, tenant-context real, y un modelo de módulos más escalable guiado por backend.

### ¿La UI permite activar/desactivar módulos?
- Hay UI administrativa de módulos y permisos.
- La activación por licencia/tenant existe a nivel de componente, pero no está integrada claramente al flujo principal.

### ¿Es escalable agregar módulos nuevos?
- Moderado-bajo en estado actual: para módulo nuevo se requieren cambios en mapeos frontend (`MODULE_ROUTE_MAP`, labels/icons y rutas).

### ¿Existe separación clara por dominio de negocio?
- Parcial: hay áreas por dominio (inventory, products, quotes, etc.) con lazy routes.
- Pero hay duplicidad/legacy (`inventario` vs `inventory`) y acoplamiento en constantes centrales.

### ¿La arquitectura Angular permite crecimiento modular real?
- Base aceptable (standalone + lazy loading), pero falta una “fuente de verdad” backend-driven para navegación/capacidades y políticas uniformes de guards.

## Riesgos UX y seguridad
- Sesión percibida como activa solo por presencia de token (sin validar expiración), provocando UX confusa hasta recibir `401`.
- Ausencia de `AuthGuard` en `/main` genera comportamiento inconsistente para acceso directo por URL.
- Mapeo manual de módulos degrada UX al introducir nuevos paquetes (entradas pueden caer en `welcome`).
- Componente de licencias no integrado en panel principal limita operación SaaS real para administración comercial.

## Arquitectura recomendada (ideal SaaS frontend)

### 1) Contrato backend-driven para navegación/capacidades
- Endpoint único post-login: `me/context` con:
  - `user`, `roles`, `permissions`
  - `tenant`, `branches`, `activeBranch`
  - `enabledModules[]` con `key`, `label`, `icon`, `baseRoute`, `children`
- Sidebar y guards consumen ese contrato; eliminar mapeos rígidos locales.

### 2) JWT y sesión
- Guard de autenticación real (`AuthGuard`) para `/main`.
- Servicio de sesión que:
  - decodifica claims no sensibles (`exp`, `sub`, `tenant`),
  - dispara logout/refresh antes de expiración,
  - sincroniza estado entre tabs.
- Mantener verificación final siempre en backend.

### 3) Guards por módulo y capacidad
- `AuthGuard`: autenticado.
- `ModuleGuard`: módulo/licencia activa.
- `PermissionGuard`: acción fina (ej. `products.read`, `products.write`).
- `CanMatch` preferible para evitar cargar bundles no autorizados.

### 4) Estructura Angular para venta por paquete
- Feature libraries por dominio (`inventory`, `sales`, `purchases`, etc.).
- Registro de módulo mediante manifiesto (`module-manifest.ts`) con rutas, íconos y permisos requeridos.
- Módulos habilitados por licencia activan manifests en bootstrap.

### 5) Multi-tenant / multi-sucursal
- `TenantContextStore` y `BranchContextStore` globales.
- Selector persistente de sucursal en header; cada cambio invalida caches y refresca data.
- Interceptor añade cabecera/contexto de sucursal cuando aplique.

### 6) Regla de oro de seguridad
- El frontend **solo mejora UX** (oculta, deshabilita, guía).
- La seguridad real debe estar en backend (JWT + autorización por tenant/rol/módulo/permiso en cada endpoint).

## Cambios prioritarios
1. Implementar `AuthGuard` en `/main` y redirecciones robustas login/main.
2. Validar expiración JWT en cliente (o estrategia refresh) para evitar sesiones “fantasma”.
3. Unificar catálogo de módulos desde backend y retirar mapeos hardcodeados críticos.
4. Integrar licencias por tenant en flujo principal de auth-admin (tab/rutas reales).
5. Introducir contexto tenant/sucursal global y propagación transversal.

## Roadmap frontend

### Fase 1 (1-2 semanas)
- AuthGuard + SessionStore (exp, logout, estado global).
- Corrección de rutas protegidas y navegación de logout SPA.

### Fase 2 (2-4 semanas)
- Contrato `me/context` backend-driven.
- Sidebar dinámico completo (sin fallback rígido a welcome).
- Guard de permisos finos.

### Fase 3 (4-6 semanas)
- Tenant/branch context real con selector UI y políticas de cache.
- Integración de licencias por tenant en panel comercial/admin.

### Fase 4 (continuo)
- Modularización por dominios/librerías y manifests para alta de nuevos paquetes sin tocar núcleo.
- Hardening UX enterprise (estados vacíos, errores por plan, onboarding por módulo).
