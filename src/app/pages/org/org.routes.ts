import { Routes } from '@angular/router';

import { OrgAssignmentsComponent } from './assignments/org-assignments.component';
import { OrgBranchesComponent } from './branches/org-branches.component';
import { OrgWarehousesComponent } from './warehouses/org-warehouses.component';

export const ORG_ROUTES: Routes = [
  { path: 'branches', component: OrgBranchesComponent },
  { path: 'branches/:id/warehouses', component: OrgWarehousesComponent },
  { path: 'assignments', component: OrgAssignmentsComponent },
  { path: '', redirectTo: 'branches', pathMatch: 'full' },
];
