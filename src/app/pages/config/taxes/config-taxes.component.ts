import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';

import { AppDataTableComponent } from '../../../shared/components/app-data-table/app-data-table.component';
import { AppDataTableColumn } from '../../../shared/components/app-data-table/app-data-table.models';

interface TaxRow {
  name: string;
  rate: string;
  status: string;
}

@Component({
  selector: 'app-config-taxes',
  standalone: true,
  imports: [CommonModule, FormsModule, NzCardModule, NzButtonModule, NzModalModule, NzInputModule, AppDataTableComponent],
  templateUrl: './config-taxes.component.html',
  styleUrls: ['./config-taxes.component.css'],
})
export class ConfigTaxesComponent {
  readonly isModalVisible = signal(false);
  taxName = '';

  readonly columns: AppDataTableColumn<TaxRow>[] = [
    { key: 'name', title: 'Nombre' },
    { key: 'rate', title: 'Tasa' },
    { key: 'status', title: 'Estado' },
  ];

  constructor(private readonly message: NzMessageService) {}

  openModal(): void {
    this.isModalVisible.set(true);
  }

  closeModal(): void {
    this.isModalVisible.set(false);
  }

  save(): void {
    this.message.info('Pendiente de integrar backend');
    this.taxName = '';
    this.closeModal();
  }
}
