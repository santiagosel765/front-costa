import { Component, inject } from '@angular/core';

import { CatalogPageComponent } from '../catalog-page/catalog-page.component';
import { ConfigCurrencyService } from '../../../services/config/config-currency.service';

@Component({
  selector: 'app-config-currencies',
  standalone: true,
  imports: [CatalogPageComponent],
  template: `<app-catalog-page title="Monedas" moduleKey="CONFIG" createLabel="Nueva moneda" [api]="api"></app-catalog-page>`,
})
export class ConfigCurrenciesComponent {
  readonly api = inject(ConfigCurrencyService);
}
