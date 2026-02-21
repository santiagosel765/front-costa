# Auditoría Frontend Angular + NG-ZORRO (UI Enterprise)

## A) Resumen ejecutivo

- El frontend está construido con **Angular 19 standalone + lazy routes** y usa **NG-ZORRO** como librería UI principal.
- Existe una base sólida en el módulo de **Core de Autenticación** (`/main/auth`) con tablas, formularios y patrón visual consistente (headers + cards + spacing).
- La seguridad en UI se apoya en dos ejes:
  - `ModuleGuard`: valida acceso por módulo habilitado vía API `/v1/auth/modules`.
  - `SidebarComponent`/`MODULE_ROUTE_MAP`: construye menú dinámico con los módulos activos.
- Se detectan **inconsistencias funcionales** relevantes:
  - Ruta `/main/auth/licenses` está declarada pero no se renderiza en tabs (el panel solo contempla `users/roles/modules/permissions`).
  - Varias rutas del menú no existen (ej. `/main/suppliers/panel`, `/main/companies/panel`), lo que genera huecos UX.
  - Claves de módulos no homogéneas (`QUOTE` vs `QUOTES`, `PROVIDER` vs `SUPPLIERS`), con riesgo de ocultar opciones válidas.
- El estado combina **signals en componentes** + un store simple con `BehaviorSubject` para módulos. No hay NgRx.
- Se recomienda un refactor incremental orientado a **design system mínimo**, estandarización de shells (Page/Table/Form), y contratos de autorización UI alineados con backend.

## B) Mapa de módulos

### Núcleo técnico

- `src/app/core`
  - `services/api.service.ts`: wrapper HTTP tipado.
  - `interceptors/auth.interceptor.ts`: inyección de JWT y manejo 401.
  - `guards/module.guard.ts`: control de acceso por módulo habilitado.
  - `state/modules.store.ts`: caché/reactividad de módulos habilitados.
  - `constants/module-route-map.ts`: normalización alias + mapa de rutas/íconos/labels.

- `src/app/layout`
  - `main-layout.component.ts`: shell principal con `nz-layout`, sider y header.
  - `sidebar/sidebar.component.ts`: menú lateral dinámico por módulos activos.

### Funcionales principales

- `src/app/auth/login`
  - `login.component`: autenticación y entrada al sistema.

- `src/app/pages/auth-admin`
  - `auth-admin-panel.component`: panel tabulado (usuarios, roles, módulos, permisos).
  - Submódulos:
    - `users`: listado y formulario.
    - `roles`: listado y formulario.
    - `modules`: listado y formulario.
    - `permissions`: matriz de asignación rol ↔ módulos.
    - `licenses`: componente de licencias (implementado pero no integrado al panel).

- Otros shells/páginas operativas
  - `welcome`, `categories`, `products`, `inventory`, `client`, `provider`, `quote`, `purchase`.
  - Variantes duplicadas de inventario (`pages/inventory` y `pages/inventario`) sugieren deuda técnica/naming drift.

### Librerías/patrones detectados

- UI: `ng-zorro-antd` (layout, cards, tabs, table, form, message, etc.).
- Reactividad: RxJS (`forkJoin`, `finalize`, `shareReplay`, `expand`, `reduce`) + Angular `signal`/`computed`.
- Estado global liviano: `ModulesStore` con `BehaviorSubject`.
- No se detecta NgRx/Akita/NGXS.

## C) Inventario de rutas y pantallas

> Nota: rutas agrupadas por módulo de negocio. “API calls” indica servicios/endpoints consumidos por la pantalla.

| Ruta | Módulo | Componente | Guards | API calls | Estado | Observaciones UX |
|---|---|---|---|---|---|---|
| `/login` | auth/login | `LoginComponent` | — | `POST /v1/auth/login` | Implementada | Flujo claro, validación mínima, mensajes explícitos. |
| `/main/welcome` | welcome | `WelcomeComponent` | — | No evidente | Implementada | Pantalla landing interna. |
| `/main/auth` | auth-admin | `AuthAdminPanelComponent` | `ModuleGuard` (`CORE_DE_AUTENTICACION`) a nivel padre | Según tab activa | Implementada | Buen header + tabs. |
| `/main/auth/users` | auth-admin/users | `AuthAdminPanelComponent` (tab users) | hereda guard padre | `GET /v1/auth/admin/users` + `DELETE /v1/auth/admin/users/:id` | Implementada | Tabla con filtros y estados. |
| `/main/auth/users/new` | auth-admin/users | `UserFormComponent` | hereda guard padre | `GET /v1/auth/admin/roles`, `POST /v1/auth/admin/users` | Implementada | Formulario correcto, sin dirty-checking al cancelar. |
| `/main/auth/users/:id/edit` | auth-admin/users | `UserFormComponent` | hereda guard padre | `GET /v1/auth/admin/users/:id`, `GET /v1/auth/admin/roles`, `PUT /v1/auth/admin/users/:id` | Implementada | Carga inicial sin skeleton. |
| `/main/auth/roles` | auth-admin/roles | `AuthAdminPanelComponent` (tab roles) | hereda guard padre | `GET /v1/auth/admin/roles`, `DELETE /v1/auth/admin/roles/:id` | Implementada | Tabla consistente. |
| `/main/auth/roles/new` | auth-admin/roles | `RoleFormComponent` | hereda guard padre | `POST /v1/auth/admin/roles` | Implementada | Validaciones base. |
| `/main/auth/roles/:id/edit` | auth-admin/roles | `RoleFormComponent` | hereda guard padre | `GET /v1/auth/admin/roles/:id`, `PUT /v1/auth/admin/roles/:id` | Implementada | Correcto para CRUD básico. |
| `/main/auth/modules` | auth-admin/modules | `AuthAdminPanelComponent` (tab modules) | hereda guard padre | `GET /v1/auth/admin/modules`, `DELETE /v1/auth/admin/modules/:id` | Implementada | Columna “Licencias” placeholder. |
| `/main/auth/modules/new` | auth-admin/modules | `ModuleFormComponent` | hereda guard padre | `POST /v1/auth/admin/modules` | Implementada | Form simple. |
| `/main/auth/modules/:id/edit` | auth-admin/modules | `ModuleFormComponent` | hereda guard padre | `GET /v1/auth/admin/modules/:id`, `PUT /v1/auth/admin/modules/:id` | Implementada | Igual patrón role-form. |
| `/main/auth/permissions` | auth-admin/permissions | `AuthAdminPanelComponent` (tab permissions) | hereda guard padre | `GET /v1/auth/admin/roles`, `GET /v1/auth/admin/modules`, `GET /v1/auth/admin/role-modules?roleId=`, `PUT /v1/auth/admin/role-modules/:roleId` | Implementada | Dual-list funcional; buena señalización de cambios. |
| `/main/auth/licenses` | auth-admin/licenses | **declarada en rutas, no visible en tabset** | hereda guard padre | debería usar `/v1/auth/admin/module-licenses` | Parcial/Inconsistente | `data.tab` apunta a `permissions`; `ModuleLicensesComponent` no está embebido en panel. |
| `/main/categories/panel` | categories | `PanelCategoriesComponent` | `ModuleGuard` (`INVENTORY`) | `CategoryService` (base `/v1/categories`) | Implementada | Ruta funcional. |
| `/main/products/panel` | products | `PanelProductsComponent` | `ModuleGuard` (`INVENTORY`) | `ProductService` (base `/v1/products`) | Implementada | Ruta funcional. |
| `/main/inventory` | inventory | `InventoryShellComponent` | `ModuleGuard` (`INVENTORY`) | No evidente | Implementada | Menú apunta a `/main/inventory/panel` (posible mismatch). |
| `/main/clients` | client | `ClientShellComponent` | `ModuleGuard` (`CLIENT`) | No evidente | Implementada | Shell placeholder. |
| `/main/providers` | provider | `ProviderShellComponent` | `ModuleGuard` (`PROVIDER`) | No evidente | Implementada | Shell placeholder. |
| `/main/quotes` | quote | `QuoteShellComponent` | `ModuleGuard` (`QUOTE`) | No evidente | Implementada | Guard usa singular, menú legacy usa plural en otra capa. |
| `/main/purchases` | purchase | `PurchaseShellComponent` | `ModuleGuard` (`PURCHASE`) | No evidente | Implementada | Shell placeholder. |

### Huecos / rutas no implementadas o desalineadas

- `MenuBuilderService` define rutas no presentes en router principal (`/main/companies/panel`, `/main/users/panel`, `/main/reports/*`, `/main/sales/*`, `/main/suppliers/panel`, `/main/purchase-orders/panel`, `/main/settings/*`).
- Existe carpeta `pages/inventario` con otro `INVENTORY_ROUTES` no consumido por `app.routes.ts`.

## D) Guards + menú + seguridad UI

### ModuleGuard

- Obtiene `moduleKey` desde `route.data.moduleKey`, lo normaliza (`normalizeModuleName`) y consulta módulos habilitados vía `ModulesService.getAllModules()`.
- Permite acceso solo si existe módulo activo (`status === 1`) en el catálogo consumido desde backend.
- Ante error o no autorizado, redirige a `/main/welcome`.

**Conclusión técnica:**
- Seguridad UI basada en catálogo remoto de módulos (no sólo token local), lo cual es positivo.
- Riesgo: depende de caché en memoria (`shareReplay`) y no hay trigger explícito por tenant switch (salvo reset manual en login/401).

### Sidebar/Menu

- El menú real visible lo genera `SidebarComponent` con módulos de backend + `MODULE_ROUTE_MAP`, no `MenuBuilderService`.
- `MenuBuilderService` parece quedar como estrategia alterna/legacy (config estática extensa), creando doble “fuente de verdad”.

**Riesgos de inconsistencia con backend**
- Si backend habilita módulo sin mapeo en `MODULE_ROUTE_MAP`, usuario cae en `/main/welcome`.
- Si ruta existe en menú estático pero no en router, se rompe navegación.
- Alias y claves no totalmente homogéneas (p. ej. `QUOTES`->`QUOTE`, `SUPPLIERS`->`PROVIDER`) elevan riesgo de reglas divergentes entre guard, menú y backend.

## E) Servicios y consumo API

### Capa HTTP

- `ApiService` centraliza `get/post/put/delete` tipados y normaliza `baseUrl` + endpoints relativos.
- `AuthInterceptor` adjunta JWT (`Bearer`) a requests hacia API propia y excluye login/register.
- Manejo de 401: logout + reset de módulos + navegación a `/login`.

### JWT / sesión / refresh

- JWT se persiste en `sessionStorage` (`authToken`).
- No hay flujo de refresh token implementado en interceptor.
- `AuthService.logout()` solo limpia token; no invalida server-side.

### Endpoints consumidos (agrupado)

- Autenticación:
  - `POST /v1/auth/login`
- Módulos habilitados (guard/sidebar):
  - `GET /v1/auth/modules` (paginado, agregado en cliente)
- Admin Auth:
  - Users: `GET/POST /v1/auth/admin/users`, `GET/PUT/DELETE /v1/auth/admin/users/:id`, `POST /v1/auth/admin/user-roles`
  - Roles: `GET/POST /v1/auth/admin/roles`, `GET/PUT/DELETE /v1/auth/admin/roles/:id`
  - Modules: `GET/POST /v1/auth/admin/modules`, `GET/PUT/DELETE /v1/auth/admin/modules/:id`
  - Permissions: `GET /v1/auth/admin/role-modules?roleId=`, `PUT /v1/auth/admin/role-modules/:roleId`
  - Licenses: `GET/POST /v1/auth/admin/module-licenses`
- Otros dominios:
  - Categories: base `/v1/categories`
  - Products: base `/v1/products`

### DTOs / tipado

- Tipado fuerte en `auth-admin.models.ts` y servicios admin.
- Hallazgo: uso de `any` en `LoginResponse.user?: any` (debería tiparse).

## F) Estado y arquitectura

- Patrón dominante: **container component + servicio HTTP + signal local**.
- Estado transversal: `ModulesStore` (BehaviorSubjects + cache lifecycle).
- No hay arquitectura de estado global robusta para flujos complejos (ej. permisos/licencias multi-pantalla).

### Riesgos detectados

- Duplicación de lógica CRUD/filtros entre `users-list`, `roles-list`, `modules-list`.
- Suscripciones directas en componentes sin capa facade (complejidad crecerá).
- Formularios reactivos correctos en base, pero sin guards de navegación por cambios sin guardar.
- Estado de loading/error heterogéneo (toasts sí, banners de error no estandarizados).

## G) Auditoría UX enterprise (hallazgos concretos)

### Layout

- Fortalezas:
  - Uso consistente de `nz-card`, headers y spacing en módulo auth-admin.
  - Estructura shell estable con sidebar + content.
- Hallazgos:
  - Header global sin breadcrumb efectivo (placeholder vacío).
  - `inner-content` con altura fija simple; falta patrón unificado de scroll/padding por tipo de pantalla.

### Tablas

- Fortalezas:
  - Paginación básica y `nzNoResult` en listas admin.
  - Acciones claras editar/eliminar con confirmación.
- Hallazgos:
  - Sin ordenamiento server/client declarativo en cabeceras.
  - Sin toolbar estándar reutilizable (search/filter están duplicados).
  - Sin selección masiva ni acciones bulk (útil enterprise).

### Formularios

- Fortalezas:
  - Validaciones esenciales (`required`, `email`) y disabled submit por invalid.
  - Patrones visuales homogéneos en forms admin.
- Hallazgos:
  - No hay dirty-check al cancelar/salir.
  - Mensajes de error son puntuales, pero no hay resumen de errores.
  - Estados de guardado correctos, sin indicador de éxito persistente contextual.

### Feedback / estados vacíos / errores

- Toasters (`NzMessageService`) están en uso extendido.
- Empty states básicos presentes en tablas.
- Falta patrón corporativo para errores de red por sección (inline alert + retry).

### Accesibilidad (inferencia estática)

- Positivo: labels en formularios y controles con placeholders claros.
- Riesgos:
  - Uso de `<a href="/logout">` provoca recarga completa y foco no gestionado.
  - No se observa estrategia de foco al cambiar tabs/modales ni atajos teclado.
  - Contraste parece razonable pero requiere validación automática (axe/lighthouse).

## H) Propuesta de patrón enterprise (sin reescribir de golpe)

### 1) Design System mínimo sobre NG-ZORRO

- `EnterprisePageTemplate`
  - header estándar: `title`, `subtitle`, `breadcrumbs`, `primaryAction`, `secondaryActions`.
- `EnterpriseTableShell`
  - zonas: `toolbar(search, filters, chips, export)`, `table`, `pagination`, `empty/error/loading`.
- `EnterpriseFormShell`
  - `pageHeader + form card + sticky footer (Cancelar/Guardar)` + confirm de salida.

### 2) Shared UI Components sugeridos

- `PageHeaderComponent`
- `DataTableShellComponent`
- `EntityToolbarComponent`
- `EmptyStateComponent`
- `InlineErrorStateComponent`
- `ConfirmService` unificado (wrapping `NzModalService` / `NzPopconfirm`)
- `UnsavedChangesGuard` reutilizable para formularios

### 3) Contrato de autorización UI

- Unificar fuente de verdad:
  - Opción A: `ModulesStore` + `MODULE_ROUTE_MAP` como única capa UI.
  - Opción B: backend entrega menú resuelto por usuario/tenant.
- Checklist de consistencia obligatoria:
  - `moduleKey` de rutas == clave de menú == alias normalizado.
  - Ruta destino válida en router.

### 4) Estrategia incremental sin ruptura

1. **Hardening transversal** (sin tocar UI visual): normalizar claves de módulos, resolver rutas huérfanas, contrato guard/menu.
2. **Refactor por vertical en auth-admin**: extraer `TableShell`, luego `FormShell`, luego permisos/licencias.
3. **Escalar al resto**: categories/products/inventory con mismos shells.
4. **QA visual continuo** con snapshots y checklist homogénea.

## I) Backlog priorizado

| Prioridad | Épica | Historia | Pantallas afectadas | Impacto UX | Complejidad | Riesgo | Criterios de aceptación |
|---|---|---|---|---|---|---|---|
| P0 (Quick win) | Consistencia rutas | Corregir `/main/auth/licenses` para que abra vista Licencias real | Auth admin | Alto | Baja | Bajo | Ruta renderiza contenido de licencias y tab correcto. |
| P0 (Quick win) | Seguridad UI | Unificar claves módulo (`QUOTE/QUOTES`, `PROVIDER/SUPPLIERS`) | Guards + sidebar + rutas | Alto | Media | Medio | Guard, menú y rutas responden igual para mismo módulo. |
| P0 (Quick win) | Navegación | Remover enlaces menú a rutas inexistentes o crear placeholders explícitos | Sidebar/Menu | Alto | Baja | Bajo | Ningún ítem de menú termina en 404/redirect inesperado. |
| P1 | UX Table | Crear `DataTableShell` reutilizable y migrar users/roles/modules | Auth admin CRUD | Alto | Media | Medio | Toolbar + estados + paginación consistentes. |
| P1 | UX Form | Crear `FormPageShell` + dirty-check guard para forms de edición | Forms auth admin | Alto | Media | Medio | Al cancelar con cambios se solicita confirmación. |
| P1 | Error handling | Estandarizar error inline + retry por vista | Todas | Medio | Media | Bajo | Cada pantalla tiene fallback visual y botón reintentar. |
| P2 | Governance | Definir contrato backend de módulos/menú por tenant | Core auth + layout | Alto | Alta | Alto | Documento de contrato + tests de integración UI. |
| P2 | Accesibilidad | Añadir auditoría axe + foco gestionado en tabs/forms | Global | Medio | Media | Bajo | Cumplimiento WCAG AA básico en flujos críticos. |
| P3 | Observabilidad UI | Métricas de uso de pantallas y errores cliente | Global | Medio | Media | Medio | Dashboard con eventos de navegación/error. |

## J) Checklist QA visual + funcional

### Visual/UI

- [ ] Header consistente (título/subtítulo/acciones) en todas las páginas.
- [ ] Espaciado vertical/horizontal uniforme entre toolbar, tabla y paginación.
- [ ] Estados loading/empty/error con layout consistente.
- [ ] Botones primarios/secundarios con jerarquía visual estable.

### Funcional

- [ ] Cada ítem del sidebar navega a ruta existente.
- [ ] Guard bloquea correctamente módulos deshabilitados.
- [ ] Cambio de sesión/tenant refresca módulos y menú.
- [ ] CRUDs muestran mensajes de éxito/error y refrescan data.
- [ ] Formularios respetan validaciones y no pierden cambios sin confirmación.

### Seguridad/UI Auth

- [ ] 401 fuerza logout y limpia estado local.
- [ ] Token nunca se adjunta a dominios externos.
- [ ] Endpoints excluidos (login/register) no reciben Authorization header.

### Accesibilidad

- [ ] Navegación por teclado en tablas y formularios críticos.
- [ ] Foco inicial y retorno de foco tras acciones.
- [ ] Contraste AA en textos, badges y botones.
