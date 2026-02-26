import { Component, inject } from '@angular/core';

import { CatalogPageComponent } from '../catalog-page/catalog-page.component';
import { ConfigTaxService } from '../../../services/config/config-tax.service';

@Component({
  selector: 'app-config-taxes',
  standalone: true,
  imports: [CatalogPageComponent],
  template: `<app-catalog-page title="Impuestos" moduleKey="CONFIG" createLabel="Nuevo impuesto" [api]="api"></app-catalog-page>`,
})
export class ConfigTaxesComponent {
  readonly api = inject(ConfigTaxService);
}
