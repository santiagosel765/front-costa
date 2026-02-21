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
