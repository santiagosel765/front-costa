import { Routes } from '@angular/router';

import { ConfigCurrenciesComponent } from './currencies/config-currencies.component';
import { ConfigDocumentTypesComponent } from './document-types/config-document-types.component';
import { ConfigParametersComponent } from './parameters/config-parameters.component';
import { ConfigPaymentMethodsComponent } from './payment-methods/config-payment-methods.component';
import { ConfigShellComponent } from './config-shell/config-shell.component';
import { ConfigTaxesComponent } from './taxes/config-taxes.component';

export const CONFIG_ROUTES: Routes = [
  {
    path: '',
    component: ConfigShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'currencies' },
      { path: 'currencies', component: ConfigCurrenciesComponent },
      { path: 'taxes', component: ConfigTaxesComponent },
      { path: 'parameters', component: ConfigParametersComponent },
      { path: 'payment-methods', component: ConfigPaymentMethodsComponent },
      { path: 'document-types', component: ConfigDocumentTypesComponent },
    ],
  },
];
