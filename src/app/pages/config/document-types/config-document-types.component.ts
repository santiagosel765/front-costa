import { Component, inject } from '@angular/core';

import { ConfigDocumentTypeService } from '../../../services/config/config-document-type.service';
import { CatalogRecord } from '../../../services/config/config.models';
import { AppDataTableColumn } from '../../../shared/components/app-data-table/app-data-table.models';
import { CatalogFormField, CatalogPageComponent } from '../catalog-page/catalog-page.component';

@Component({
  selector: 'app-config-document-types',
  standalone: true,
  imports: [CatalogPageComponent],
  template: `<app-catalog-page title="Tipos de documento" moduleKey="CONFIG" createLabel="Nuevo tipo" [api]="api" [fields]="fields" [columnsOverride]="columns"></app-catalog-page>`,
})
export class ConfigDocumentTypesComponent {
  readonly api = inject(ConfigDocumentTypeService);

  readonly fields: CatalogFormField[] = [
    { key: 'code', label: 'Código', type: 'text', required: true },
    { key: 'name', label: 'Nombre', type: 'text', required: true },
    { key: 'description', label: 'Descripción', type: 'textarea' },
    { key: 'active', label: 'Activo', type: 'switch' },
  ];

  readonly columns: AppDataTableColumn<CatalogRecord>[] = [
    { key: 'code', title: 'Código', sortable: true },
    { key: 'name', title: 'Nombre', sortable: true },
    { key: 'description', title: 'Descripción' },
    { key: 'active', title: 'Activo', cellType: 'tag', tagColor: (r) => (r.active ? 'green' : 'red'), tagText: (r) => (r.active ? 'Sí' : 'No') },
  ];
}
