# Auditoría técnica: navegación Inventario / Datos Maestros / Sidebar / RBAC

## A) Mapa real de routing

### Ruta base del layout principal
En `src/app/app.routes.ts`, el layout principal cuelga de `/main` y renderiza `MainLayoutComponent`.

```ts
{
  path: 'main',
  component: MainLayoutComponent,
  canActivate: [AuthGuard],
  canMatch: [AuthGuard],
  children: [ ... ]
}
```

### Dónde cuelga Inventario
Dentro de esos children, Inventario está en `/main/inventory` y carga lazy `INVENTORY_ROUTES`.

```ts
{
  path: 'inventory',
  canActivate: [ModuleGuard, ActiveBranchGuard],
  canMatch: [ModuleGuard, ActiveBranchGuard],
  data: { moduleKey: 'INVENTORY' },
  loadChildren: () => import('./pages/inventory/inventory.routes').then((m) => m.INVENTORY_ROUTES),
}
```

### Child routes reales de Inventario
En `src/app/pages/inventory/inventory.routes.ts`:

```ts
export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    component: InventoryShellComponent,
    children: [
      { path: 'categories', ... },
      { path: 'brands', ... },
      { path: 'uom', ... },
      { path: 'attributes', ... },
      { path: 'tax-profiles', ... },
      { path: 'products', ... },
      { path: '', redirectTo: 'products', pathMatch: 'full' },
    ],
  },
];
```

Rutas efectivas:
- `/main/inventory/categories`
- `/main/inventory/brands`
- `/main/inventory/uom`
- `/main/inventory/attributes`
- `/main/inventory/tax-profiles`
- `/main/inventory/products`
- redirect: `/main/inventory` -> `/main/inventory/products`

### Qué componente renderiza el outlet en cada nivel
- Nivel `/main/*`: `MainLayoutComponent` contiene `<router-outlet></router-outlet>`.
- Nivel `/main/inventory/*`: `inventory-shell.component.html` contiene `<router-outlet></router-outlet>`.

## B) Sidebar: cómo se arma y cómo navega

### Dónde se construye
`src/app/layout/sidebar/sidebar.component.ts`.

No es estático: se arma desde backend vía `sessionStore.modules$` y se transforma con `buildMenuItem(module)`.

```ts
this.sessionStore.modules$
  .pipe(takeUntil(this.destroy$))
  .subscribe({
    next: (modules) => {
      const uniqueMenuItems = new Map<string, SidebarMenuItem>();
      modules.forEach((module) => {
        const item = this.buildMenuItem(module);
        if (!uniqueMenuItems.has(item.key)) {
          uniqueMenuItems.set(item.key, item);
        }
      });
      this.menuItems = Array.from(uniqueMenuItems.values());
    }
  });
```

En template usa:

```html
<a [routerLink]="item.route">
```

### Mapping key -> ruta/label/icono
`src/app/core/constants/module-route-map.ts`:
- Normalización con alias (`normalizeModuleName`)
- Resolución visual con `resolveModulePresentation`

Snippet clave:

```ts
export const MODULE_ALIAS: Record<string, string> = {
  CONFIGURACION: 'CONFIG',
  CONFIG: 'CONFIG',
  ORGANIZACION: 'ORG',
  ORG_HUB: 'ORG',
  INVENTARIO: 'INVENTORY',
  ...
};

export const MODULE_UI_MANIFEST: Record<string, ModuleUiManifest> = {
  INVENTORY: { route: '/main/inventory', label: 'Inventario', icon: 'database' },
  CONFIG: { route: '/main/config', label: 'Configuración', icon: 'setting' },
  ORG: { route: '/main/org', label: 'Organización', icon: 'apartment' },
  ...
};

const shouldPreferManifestRoute = key === 'ORG' || key === 'INVENTORY';

return {
  route: shouldPreferManifestRoute ? fromManifest.route : (module.baseRoute || fromManifest.route),
  ...
};
```

### Hallazgos del sidebar
1. **`DATOS_MAESTROS` no está en alias ni en manifest**. Resultado: `resolveModulePresentation` devuelve fallback `/main/welcome`, por eso aparece módulo pero no lleva a pantalla de datos maestros.
2. **`SUCURSALES_Y_ORGANIZACIONES` tampoco está en alias/manifest**. También cae a `/main/welcome`.
3. Para módulos conocidos distintos de ORG/INVENTORY (ej. CONFIG), la ruta final puede venir de `module.baseRoute` (backend). Si backend envía una ruta no registrada en Angular, el click puede dar `Cannot match any routes`.

## C) RBAC / permisos

### Implementación actual
`src/app/core/state/session.store.ts`:

```ts
hasPermission(moduleKey: string, perm: string): boolean {
  if (this.isAdmin()) {
    return true;
  }

  const normalizedModuleKey = normalizeModuleName(moduleKey) ?? moduleKey;
  const permissions = this.snapshot.permissions[normalizedModuleKey] ?? { read: false, write: false, delete: false };
  const normalizedPerm = perm.toLowerCase() as keyof AuthContextPermissions[string];
  return Boolean(permissions[normalizedPerm]);
}

canWrite(moduleKey: string): boolean {
  return this.hasPermission(moduleKey, 'write');
}
```

### Ejemplo con rol ADMIN
`isAdmin()` retorna true si cualquier rol contiene `ADMIN`:

```ts
return this.snapshot.roles.some((role) => {
  const normalizedRole = role.trim().toUpperCase();
  return normalizedRole.includes('ADMIN');
});
```

Entonces `hasPermission('INVENTORY','write')` => **true** para ADMIN, incluso si `permissions['INVENTORY']` no existe.

### Directiva `*appHasPermission` y recarga async
`src/app/shared/directives/has-permission.directive.ts`:

```ts
constructor() {
  this.permissionsSub = this.sessionStore.permissions$.subscribe(() => {
    this.render();
  });
}
```

Sí re-renderiza cuando cambia `permissions$` (incluyendo la carga async posterior de `loadEffectivePermissions`).

**Conclusión RBAC**:
- No se encontró bug de “no re-renderiza directiva”.
- Sí puede ocultar botones para roles no-admin cuando backend no devuelve permisos efectivos esperados.
- El bloqueo de navegación principal de módulos ocurre antes por mapping/rutas/sidebar (punto B), no por la directiva.

## D) Reproducción guiada (pasos + checks)

### Pasos funcionales
1. Login con usuario que tenga módulos como `INVENTORY`, `DATOS_MAESTROS`, `SUCURSALES_Y_ORGANIZACIONES`.
2. Click en item “Inventario” del sidebar.
   - Esperado: entrar a `/main/inventory` y ver redirect a `/main/inventory/products`.
   - Actual (según código): **debe funcionar** si módulo INVENTORY está habilitado y hay sucursal activa (por `ActiveBranchGuard`).
3. Click en item “Datos Maestros” (si viene con key `DATOS_MAESTROS`).
   - Esperado: abrir categorías/marcas/uom/etc.
   - Actual (según código): va a `/main/welcome` por falta de mapping.

### Checks de consola/network recomendados
- Console al click:
  - Si baseRoute inválida en módulo conocido no forzado a manifest: `NG04002: Cannot match any routes. URL Segment: '...'`
- Network:
  - Al navegar entre hijos de inventario se resuelven chunks lazy de esos componentes.
- URL:
  - Debe cambiar a `/main/inventory/products`, `/main/inventory/categories`, etc.

> En esta auditoría se validó por lectura de código (estática). No se adjuntan logs runtime del navegador porque no hubo sesión funcional de backend/autenticación disponible en este entorno.

## E) Diagnóstico final (priorizado)

1. **Causa raíz #1 (más probable): mapping de módulos incompleto en sidebar**
   - `DATOS_MAESTROS` y otras keys reales del backend no mapean a rutas de Inventario.
   - Efecto: sidebar muestra ítems pero navega a fallback (`/main/welcome`) y “parece que no carga nada”.
   - Archivo a tocar: `src/app/core/constants/module-route-map.ts`.

2. **Causa raíz #2: posible desalineación `module.baseRoute` vs rutas Angular**
   - En `resolveModulePresentation`, varios módulos usan `module.baseRoute` (backend) en lugar de ruta manifest.
   - Si backend manda baseRoute inexistente, el click falla por routing.
   - Archivo a tocar: `src/app/core/constants/module-route-map.ts` (regla `shouldPreferManifestRoute`).

3. **Causa raíz #3: guardas de ruta para inventario**
   - `/main/inventory` requiere `ModuleGuard` + `ActiveBranchGuard`.
   - Si no hay módulo habilitado o sucursal activa, redirige y puede percibirse como “no carga”.
   - Archivos: `src/app/app.routes.ts`, `src/app/core/guards/module.guard.ts`, `src/app/core/guards/active-branch.guard.ts`.

4. **RBAC en botones (secundario)**
   - `*appHasPermission="['INVENTORY','write']"` sí re-renderiza. Para ADMIN da true por bypass.
   - Para no-admin depende de permisos efectivos cargados.
   - Archivos: `src/app/core/state/session.store.ts`, `src/app/shared/directives/has-permission.directive.ts`.

## Correcciones recomendadas (sin refactor grande)

1. Añadir aliases faltantes y/o entradas de manifest para keys reales del backend (`DATOS_MAESTROS`, `SUCURSALES_Y_ORGANIZACIONES`, etc.) apuntando a rutas existentes.
2. Para módulos críticos, priorizar ruta manifest en vez de `baseRoute` backend cuando se conozca la ruta frontend.
3. (Opcional para depuración) log temporal de `router.config` y de `menuItems` resueltos por key/ruta; revertir al terminar auditoría.
