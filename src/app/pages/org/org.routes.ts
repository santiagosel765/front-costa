import { Routes } from '@angular/router';

import { OrgHubComponent } from './org-hub/org-hub.component';
import { OrgLegacyRedirectComponent } from './org-legacy-redirect.component';

export const ORG_ROUTES: Routes = [
  { path: '', component: OrgHubComponent },
  { path: 'branches', component: OrgLegacyRedirectComponent, data: { tab: 'branches' } },
  { path: 'assignments', component: OrgLegacyRedirectComponent, data: { tab: 'assignments' } },
  { path: 'warehouses', component: OrgLegacyRedirectComponent, data: { tab: 'warehouses' } },
  { path: 'numbering', component: OrgLegacyRedirectComponent, data: { tab: 'numbering' } },
  { path: 'branches/:id/warehouses', component: OrgLegacyRedirectComponent, data: { tab: 'warehouses' } },
];
