import { Routes } from '@angular/router';

import { InventoryShellComponent } from './inventory-shell.component';

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    component: InventoryShellComponent,
    children: [
      { path: 'categories', loadComponent: () => import('./categories/categories-page.component').then(m => m.CategoriesPageComponent) },
      { path: 'brands', loadComponent: () => import('./brands/brands-page.component').then(m => m.BrandsPageComponent) },
      { path: 'uom', loadComponent: () => import('./uom/uom-page.component').then(m => m.UomPageComponent) },
      { path: 'attributes', loadComponent: () => import('./attributes/attributes-page.component').then(m => m.AttributesPageComponent) },
      { path: 'tax-profiles', loadComponent: () => import('./tax-profiles/tax-profiles-page.component').then(m => m.TaxProfilesPageComponent) },
      { path: 'products', loadComponent: () => import('./products/products-page.component').then(m => m.ProductsPageComponent) },
      { path: '', redirectTo: 'products', pathMatch: 'full' },
    ],
  },
];
