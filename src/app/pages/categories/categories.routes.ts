// src/app/pages/categories/categories.routes.ts
import { Routes } from '@angular/router';

export const CATEGORIES_ROUTES: Routes = [
{
    path: 'panel',
    loadComponent: () => import('./panel-categories/panel-categories.component')
      .then(m => m.PanelCategoriesComponent)
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