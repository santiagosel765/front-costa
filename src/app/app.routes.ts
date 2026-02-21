// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout.component';
import { ModuleGuard } from './core/guards/module.guard';

export const routes: Routes = [
  // 🔑 Login completamente independiente
  {
    path: 'login',
    loadChildren: () => import('./auth/login/login.routes').then(m => m.login_routes)
  },

  // 🏠 Todas las páginas principales con layout
  {
    path: 'main',
    component: MainLayoutComponent,
    children: [
      {
        path: 'auth',
        canActivate: [ModuleGuard],
        data: { moduleKey: 'CORE_DE_AUTENTICACION' },
        loadChildren: () => import('./pages/auth-admin/auth-admin.routes').then(m => m.AUTH_ADMIN_ROUTES),
      },
      {
        path: 'welcome',
        loadChildren: () => import('./pages/welcome/welcome.routes').then(m => m.WELCOME_ROUTES)
      },
      {
        path: 'categories',  // 🆕 Rutas de categorías
        canActivate: [ModuleGuard],
        data: { moduleKey: 'INVENTORY' },
        loadChildren: () => import('./pages/categories/categories.routes').then(m => m.CATEGORIES_ROUTES)
      },
      {
        path: 'products',  // 🆕 Para el futuro
        canActivate: [ModuleGuard],
        data: { moduleKey: 'INVENTORY' },
        loadChildren: () => import('./pages/products/products.routes').then(m => m.PRODUCTS_ROUTES)
      },
      {
        path: 'inventory',  // 🆕 Para el futuro
        canActivate: [ModuleGuard],
        data: { moduleKey: 'INVENTORY' },
        loadChildren: () => import('./pages/inventory/inventory.routes').then(m => m.INVENTORY_ROUTES)
      },
      {
        path: 'clients',
        canActivate: [ModuleGuard],
        data: { moduleKey: 'CLIENT' },
        loadChildren: () => import('./pages/client/client.routes').then(m => m.CLIENT_ROUTES)
      },
      {
        path: 'providers',
        canActivate: [ModuleGuard],
        data: { moduleKey: 'PROVIDER' },
        loadChildren: () => import('./pages/provider/provider.routes').then(m => m.PROVIDER_ROUTES)
      },
      {
        path: 'quotes',
        canActivate: [ModuleGuard],
        data: { moduleKey: 'QUOTE' },
        loadChildren: () => import('./pages/quote/quote.routes').then(m => m.QUOTE_ROUTES)
      },
      {
        path: 'purchases',
        canActivate: [ModuleGuard],
        data: { moduleKey: 'PURCHASE' },
        loadChildren: () => import('./pages/purchase/purchase.routes').then(m => m.PURCHASE_ROUTES)
      },
      /*
      {
        path: 'reports',  // 🆕 Para el futuro
        loadChildren: () => import('./pages/reports/reports.routes').then(m => m.REPORTS_ROUTES)
      }, */
      // Redirección por defecto
      { path: '', redirectTo: 'welcome', pathMatch: 'full' }
    ]
  },

  // 🔄 Redirecciones principales
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
