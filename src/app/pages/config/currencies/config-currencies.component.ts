import { Component, inject } from '@angular/core';

import { ConfigCurrencyService } from '../../../services/config/config-currency.service';
import { CatalogRecord } from '../../../services/config/config.models';
import { AppDataTableColumn } from '../../../shared/components/app-data-table/app-data-table.models';
import { CatalogFormField, CatalogPageComponent } from '../catalog-page/catalog-page.component';

@Component({
  selector: 'app-config-currencies',
  standalone: true,
  imports: [CatalogPageComponent],
  template: `<app-catalog-page title="Monedas" moduleKey="CONFIG" createLabel="Nueva moneda" [api]="api" [fields]="fields" [columnsOverride]="columns"></app-catalog-page>`,
})
export class ConfigCurrenciesComponent {
  readonly api = inject(ConfigCurrencyService);

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
