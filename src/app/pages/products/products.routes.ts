// src/app/pages/categories/categories.routes.ts
import { Routes } from '@angular/router';

export const PRODUCTS_ROUTES: Routes = [
{
    path: 'panel',
    loadComponent: () => import('./panel-products/panel-products.component')
      .then(m => m.PanelProductsComponent)
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