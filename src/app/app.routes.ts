import { Routes } from '@angular/router';

import { ActiveBranchGuard } from './core/guards/active-branch.guard';
import { AuthGuard } from './core/guards/auth.guard';
import { ModuleGuard } from './core/guards/module.guard';
import { MainLayoutComponent } from './layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./auth/login/login.routes').then((m) => m.login_routes),
  },
  {
    path: 'auth/login',
    loadChildren: () => import('./auth/login/login.routes').then((m) => m.login_routes),
  },
  {
    path: 'main',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    canMatch: [AuthGuard],
    children: [
      {
        path: 'auth',
        canActivate: [ModuleGuard],
        canMatch: [ModuleGuard],
        data: { moduleKey: 'CORE_DE_AUTENTICACION' },
        loadChildren: () => import('./pages/auth-admin/auth-admin.routes').then((m) => m.AUTH_ADMIN_ROUTES),
      },
      {
        path: 'welcome',
        loadChildren: () => import('./pages/welcome/welcome.routes').then((m) => m.WELCOME_ROUTES),
      },
      {
        path: 'categories',
        canActivate: [ModuleGuard],
        canMatch: [ModuleGuard],
        data: { moduleKey: 'INVENTORY' },
        loadChildren: () => import('./pages/categories/categories.routes').then((m) => m.CATEGORIES_ROUTES),
      },
      {
        path: 'products',
        canActivate: [ModuleGuard],
        canMatch: [ModuleGuard],
        data: { moduleKey: 'INVENTORY' },
        loadChildren: () => import('./pages/products/products.routes').then((m) => m.PRODUCTS_ROUTES),
      },
      {
        path: 'inventory',
        canActivate: [ModuleGuard, ActiveBranchGuard],
        canMatch: [ModuleGuard, ActiveBranchGuard],
        data: { moduleKey: 'INVENTORY' },
        loadChildren: () => import('./pages/inventory/inventory.routes').then((m) => m.INVENTORY_ROUTES),
      },
      {
        path: 'clients',
        canActivate: [ModuleGuard],
        canMatch: [ModuleGuard],
        data: { moduleKey: 'CLIENT' },
        loadChildren: () => import('./pages/client/client.routes').then((m) => m.CLIENT_ROUTES),
      },
      {
        path: 'providers',
        canActivate: [ModuleGuard],
        canMatch: [ModuleGuard],
        data: { moduleKey: 'PROVIDER' },
        loadChildren: () => import('./pages/provider/provider.routes').then((m) => m.PROVIDER_ROUTES),
      },
      {
        path: 'quotes',
        canActivate: [ModuleGuard],
        canMatch: [ModuleGuard],
        data: { moduleKey: 'QUOTE' },
        loadChildren: () => import('./pages/quote/quote.routes').then((m) => m.QUOTE_ROUTES),
      },
      {
        path: 'purchases',
        canActivate: [ModuleGuard, ActiveBranchGuard],
        canMatch: [ModuleGuard, ActiveBranchGuard],
        data: { moduleKey: 'PURCHASE' },
        loadChildren: () => import('./pages/purchase/purchase.routes').then((m) => m.PURCHASE_ROUTES),
      },

      {
        path: 'config',
        canActivate: [ModuleGuard],
        canMatch: [ModuleGuard],
        data: { moduleKey: 'CONFIG' },
        loadChildren: () => import('./pages/config/config.routes').then((m) => m.CONFIG_ROUTES),
      },
      {
        path: 'org',
        canActivate: [ModuleGuard],
        canMatch: [ModuleGuard],
        data: { moduleKey: 'ORG' },
        loadChildren: () => import('./pages/org/org.routes').then((m) => m.ORG_ROUTES),
      },
      { path: '', redirectTo: 'welcome', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/auth/login' },
];
