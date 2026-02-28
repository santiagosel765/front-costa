# Auditoría Frontend — Sprint 1 + Sprint 2 (Config + Org)

Fecha: 2026-02-28

## A) Checklist de verificación

### 1) Rutas y navegación
- ✅ Rutas `Config` confirmadas:
  - `/main/config/currencies`
  - `/main/config/taxes`
  - `/main/config/parameters`
  - `/main/config/payment-methods`
  - `/main/config/document-types`
- ✅ Rutas `Org` confirmadas:
  - `/main/org/branches`
  - `/main/org/branches/:id/warehouses`
  - `/main/org/assignments`
- ✅ Menú lateral muestra módulos `Configuración` y `Organización` mediante `MODULE_UI_MANIFEST` + `SidebarComponent`.

### 2) `CatalogPageComponent` dinámico
- ✅ `fields` soporta tipos: `text`, `number`, `textarea`, `switch`.
- ✅ Fallback por defecto (`code`, `name`, `active`) existe y mantiene compatibilidad para pantallas sin `fields` personalizados.
- ✅ `columnsOverride` funciona y agrega automáticamente `updatedAt` y `actions` cuando no vienen en override.

### 3) Modelos y normalización
- ✅ `CatalogRecord` prioriza `updatedAt`.
- ✅ Existe fallback temporal desde `updated_at` solo en `normalizeCatalogRecord`.
- ✅ Formularios/envío de payload cubren campos requeridos por catálogo:
  - `description` (catálogos config y branches)
  - `rate` (impuestos)
  - `value` (parámetros)
  - `address` (sucursales)

### 4) RBAC
- ✅ En catálogos genéricos, acciones de crear/editar/eliminar se ocultan/deshabilitan según `canWrite(moduleKey)` y `hasPermission(moduleKey, 'delete')`.
- ✅ `/main/org/assignments` usa `canWrite('ORG')` para crear y `hasPermission('ORG','delete')` para eliminar.

### 5) Org Assignments
- ✅ Service usa endpoints esperados:
  - `GET /v1/org/user-branch-assignments?userId=...`
  - `GET /v1/org/user-branch-assignments?branchId=...`
  - `POST /v1/org/user-branch-assignments`
  - `DELETE /v1/org/user-branch-assignments/{id}`
- ✅ Se implementó manejo específico de error `409` con mensaje amigable: “La asignación ya existe para ese usuario y sucursal”.
- ✅ TODO de selector de usuarios está marcado (actualmente `userId` manual).

### 6) Smoke test manual (script de pasos)
1. Iniciar sesión con usuario con permisos `CONFIG` y `ORG`.
2. Ir a `/main/config/currencies`.
3. Crear moneda con:
   - Código: `USD`
   - Nombre: `Dólar`
   - Descripción: `Moneda de prueba`
   - Activo: `true`
4. Editar la moneda creada y cambiar descripción a `Descripción editada`.
5. Verificar en tabla que columna **Actualizado** (`updatedAt`) se muestra con valor (no `-`).
6. Ir a `/main/org/branches` y crear sucursal con `address` + `description`.
7. Ir a `/main/org/assignments` y crear asignación con `userId` (UUID manual) + sucursal.
8. Repetir creación con mismo `userId` + `branchId`.
9. Verificar que UI muestra mensaje amigable de duplicado (409).

## B) Mismatches de contrato detectados
- ⚠️ En `OrgAssignmentService.list`, cuando no se filtra por un campo se envía query param vacío (`userId=''` o `branchId=''`) en vez de omitirlo. Esto suele funcionar, pero puede diferir de backends que esperan ausencia del parámetro en lugar de string vacío.
- ⚠️ Fallback `updated_at` sigue presente (como se esperaba temporalmente). Debe retirarse cuando backend garantice camelCase en todos los endpoints.

## C) Mejoras UX pequeñas propuestas
- Agregar empty state explícito en `/main/org/assignments` cuando no hay resultados según filtro (mensaje contextual “No hay asignaciones para este criterio”).
- En modal de creación de asignación, mostrar helper text bajo `userId` con formato esperado de UUID.
- En tablas de catálogos, considerar formato relativo o local para `updatedAt` (ej. `dd/MM/yyyy HH:mm`).

## Lista de archivos revisados
- `src/app/app.routes.ts`
- `src/app/pages/config/config.routes.ts`
- `src/app/pages/org/org.routes.ts`
- `src/app/core/constants/module-route-map.ts`
- `src/app/layout/sidebar/sidebar.component.ts`
- `src/app/layout/sidebar/sidebar.component.html`
- `src/app/pages/config/catalog-page/catalog-page.component.ts`
- `src/app/pages/config/catalog-page/catalog-page.component.html`
- `src/app/services/config/config.models.ts`
- `src/app/pages/config/currencies/config-currencies.component.ts`
- `src/app/pages/config/taxes/config-taxes.component.ts`
- `src/app/pages/config/parameters/config-parameters.component.ts`
- `src/app/pages/config/payment-methods/config-payment-methods.component.ts`
- `src/app/pages/config/document-types/config-document-types.component.ts`
- `src/app/pages/org/branches/org-branches.component.ts`
- `src/app/pages/org/branches/org-branches.component.html`
- `src/app/pages/org/assignments/org-assignments.component.ts`
- `src/app/pages/org/assignments/org-assignments.component.html`
- `src/app/services/org/org-assignment.service.ts`

## D) Commit message sugerido
`chore(audit): document sprint 1/2 config-org compliance and add 409 duplicate handling for org assignments`
