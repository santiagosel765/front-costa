// src/app/pages/categories/categories.routes.ts
import { Routes } from '@angular/router';

export const INVENTORY_ROUTES: Routes = [
{
    path: 'panel',
    loadComponent: () => import('./panel-inventario/panel-inventario.component')
      .then(m => m.PanelInventarioComponent)
  },
 /*  {
    path: 'create',
    loadComponent: () => import('./create-category/create-category.component')
      .then(m => m.CreateCategoryComponent)
  },
  {
    path: 'update/:id',
    loadComponent: () => import('./update-category/update-category.component')
      .then(m => m.UpdateCategoryComponent)
  },  */
  {
    path: '',
    redirectTo: 'panel',
    pathMatch: 'full'
  }
];