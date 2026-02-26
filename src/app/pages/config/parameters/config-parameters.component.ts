import { Component, inject } from '@angular/core';

import { CatalogPageComponent } from '../catalog-page/catalog-page.component';
import { ConfigParameterService } from '../../../services/config/config-parameter.service';

@Component({
  selector: 'app-config-parameters',
  standalone: true,
  imports: [CatalogPageComponent],
  template: `<app-catalog-page title="Parámetros" moduleKey="CONFIG" createLabel="Nuevo parámetro" [api]="api"></app-catalog-page>`,
})
export class ConfigParametersComponent {
  readonly api = inject(ConfigParameterService);
}
