import { Component, inject } from '@angular/core';

import { CatalogPageComponent } from '../catalog-page/catalog-page.component';
import { ConfigDocumentTypeService } from '../../../services/config/config-document-type.service';

@Component({
  selector: 'app-config-document-types',
  standalone: true,
  imports: [CatalogPageComponent],
  template: `<app-catalog-page title="Tipos de documento" moduleKey="CONFIG" createLabel="Nuevo tipo" [api]="api"></app-catalog-page>`,
})
export class ConfigDocumentTypesComponent {
  readonly api = inject(ConfigDocumentTypeService);
}
