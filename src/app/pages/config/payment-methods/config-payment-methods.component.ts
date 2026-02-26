import { Component, inject } from '@angular/core';

import { CatalogPageComponent } from '../catalog-page/catalog-page.component';
import { ConfigPaymentMethodService } from '../../../services/config/config-payment-method.service';

@Component({
  selector: 'app-config-payment-methods',
  standalone: true,
  imports: [CatalogPageComponent],
  template: `<app-catalog-page title="Métodos de pago" moduleKey="CONFIG" createLabel="Nuevo método" [api]="api"></app-catalog-page>`,
})
export class ConfigPaymentMethodsComponent {
  readonly api = inject(ConfigPaymentMethodService);
}
