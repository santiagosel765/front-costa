import { Component, inject } from '@angular/core';

import { ConfigParameterService } from '../../../services/config/config-parameter.service';
import { CatalogRecord } from '../../../services/config/config.models';
import { AppDataTableColumn } from '../../../shared/components/app-data-table/app-data-table.models';
import { CatalogFormField, CatalogPageComponent } from '../catalog-page/catalog-page.component';

@Component({
  selector: 'app-config-parameters',
  standalone: true,
  imports: [CatalogPageComponent],
  template: `<app-catalog-page title="Parámetros" moduleKey="CONFIG" createLabel="Nuevo parámetro" [api]="api" [fields]="fields" [columnsOverride]="columns"></app-catalog-page>`,
})
export class ConfigParametersComponent {
  readonly api = inject(ConfigParameterService);

  readonly fields: CatalogFormField[] = [
    { key: 'code', label: 'Código', type: 'text', required: true },
    { key: 'name', label: 'Nombre', type: 'text', required: true },
    { key: 'description', label: 'Descripción', type: 'textarea' },
    { key: 'value', label: 'Valor', type: 'text', required: true },
    { key: 'active', label: 'Activo', type: 'switch' },
  ];

  readonly columns: AppDataTableColumn<CatalogRecord>[] = [
    { key: 'code', title: 'Código', sortable: true },
    { key: 'name', title: 'Nombre', sortable: true },
    { key: 'description', title: 'Descripción' },
    { key: 'value', title: 'Valor' },
    { key: 'active', title: 'Activo', cellType: 'tag', tagColor: (r) => (r.active ? 'green' : 'red'), tagText: (r) => (r.active ? 'Sí' : 'No') },
  ];
}
