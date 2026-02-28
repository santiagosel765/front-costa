# FerreSasSProject

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.13.

## HTTP client & authentication interceptor

All HTTP calls go through the shared `ApiService`, which prefixes requests with the value of `environment.apiBaseUrl` (default `http://localhost:8081/ferrisys-service`). The `AuthInterceptor` automatically injects the `Authorization: Bearer <token>` header for every request except the authentication endpoints (`/v1/auth/login` and `/v1/auth/register`).

To keep the session active make sure the login flow stores the JWT token in `sessionStorage` (or `localStorage`). The interceptor reads from `sessionStorage` first and falls back to `localStorage` when present.

When you need to call a protected endpoint, inject `ApiService` in your Angular service/component and use the `get`, `post`, `put` or `delete` helpers. Example:

```ts
import { ApiService } from './core/services/api.service';

constructor(private readonly api: ApiService) {}

loadProducts() {
  return this.api.get('/v1/inventory/products');
}
```


## Sprint 3: selector de sucursal activa

- El header principal ahora carga las sucursales permitidas del usuario con `GET /v1/org/me/branches`.
- La selección se valida con `GET /v1/org/me/branches/{branchId}/validate` antes de persistir.
- La sucursal activa se persiste en `localStorage` usando la llave `activeBranchId`.
- El contexto global está disponible en `BranchContextService` vía `branches$`, `activeBranch$`, `getActiveBranchId()`, `setActiveBranch()` y `clearActiveBranch()`.
- Se agregó `ActiveBranchGuard` para exigir sucursal activa en rutas operativas de prueba: `/main/inventory` y `/main/purchases`.
- Se incluyó `BranchHeaderInterceptor` para enviar `X-Branch-Id` cuando existe sucursal activa; por defecto está desactivado con `environment.enableBranchHeader = false`.

## Development server

To start the Angular development server on its own, run:

```bash
ng serve
```

Alternatively, you can start both the Angular app and the Spring Boot backend together using the helper scripts located in `../scripts/`:

- `../scripts/run-all.sh` for Bash or other Unix-compatible shells
- `..\scripts\run-all.ps1` for Windows PowerShell

Both scripts install dependencies (via `npm ci`) and then run `npx ng serve` so the UI is available at `http://localhost:4200/`. The application automatically reloads whenever you modify the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Tablas estandarizadas del ERP (NG-ZORRO)

Las pantallas de **Usuarios**, **Roles** y **Módulos** del Core de Autenticación ahora usan el componente reusable `app-data-table` y estado de tabla persistido en query params (`page`, `size`, `q`, `status`, `sortField`, `sortOrder`).

### Modo actual (client-side)

Se usa `LocalArrayDataSource` (`src/app/shared/table/local-array-data-source.ts`) para:
- filtrar por búsqueda y estado,
- ordenar por columna,
- paginar localmente,
- devolver `{ items, total }` según `TableState`.

### Cómo migrar a server-side

1. Implementar un datasource `ApiPagedDataSource<T>` que cumpla la interfaz `TableDataSource<T>`.
2. En `load(state)` llamar endpoints paginados del backend con esta firma sugerida:
   - `GET /...?...&page=<1-based>&size=<n>&q=<texto>&status=<estado>&sortField=<campo>&sortOrder=<ascend|descend>`
3. Responder con contrato compatible:
   - `{ items: T[]; total: number; page: number; size: number }`
4. Reemplazar `LocalArrayDataSource` por `ApiPagedDataSource` en cada pantalla sin cambiar la UI (`app-data-table`).


## Nuevas rutas Sprint 1 (Config + Org)
- `/main/config/currencies`
- `/main/config/taxes`
- `/main/config/parameters`
- `/main/config/payment-methods`
- `/main/config/document-types`
- `/main/org/branches`
- `/main/org/branches/:id/warehouses`
- `/main/org/assignments`
