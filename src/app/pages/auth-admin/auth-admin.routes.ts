import { Routes } from '@angular/router';
import { AuthAdminPanelComponent } from './auth-admin-panel.component';

export const AUTH_ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AuthAdminPanelComponent,
  },
  {
    path: 'users',
    component: AuthAdminPanelComponent,
    data: { tab: 'users' },
  },
  {
    path: 'roles',
    component: AuthAdminPanelComponent,
    data: { tab: 'roles' },
  },
  {
    path: 'modules',
    component: AuthAdminPanelComponent,
    data: { tab: 'modules' },
  },
  {
    path: 'permissions',
    component: AuthAdminPanelComponent,
    data: { tab: 'permissions' },
  },
  {
    path: 'licenses',
    component: AuthAdminPanelComponent,
    data: { tab: 'permissions' },
  },
  {
    path: 'users/new',
    loadComponent: () => import('./users/user-form.component').then((m) => m.UserFormComponent),
  },
  {
    path: 'users/:id/edit',
    loadComponent: () => import('./users/user-form.component').then((m) => m.UserFormComponent),
  },
  {
    path: 'roles/new',
    loadComponent: () => import('./roles/role-form.component').then((m) => m.RoleFormComponent),
  },
  {
    path: 'roles/:id/edit',
    loadComponent: () => import('./roles/role-form.component').then((m) => m.RoleFormComponent),
  },
  {
    path: 'modules/new',
    loadComponent: () => import('./modules/module-form.component').then((m) => m.ModuleFormComponent),
  },
  {
    path: 'modules/:id/edit',
    loadComponent: () => import('./modules/module-form.component').then((m) => m.ModuleFormComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
