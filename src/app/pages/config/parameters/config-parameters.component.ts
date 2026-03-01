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

interface ParameterRow {
  code: string;
  value: string;
  status: string;
}

@Component({
  selector: 'app-config-parameters',
  standalone: true,
  imports: [CommonModule, FormsModule, NzCardModule, NzButtonModule, NzModalModule, NzInputModule, AppDataTableComponent],
  templateUrl: './config-parameters.component.html',
  styleUrls: ['./config-parameters.component.css'],
})
export class ConfigParametersComponent {
  readonly isModalVisible = signal(false);
  parameterName = '';

  readonly columns: AppDataTableColumn<ParameterRow>[] = [
    { key: 'code', title: 'Código' },
    { key: 'value', title: 'Valor' },
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
    this.parameterName = '';
    this.closeModal();
  }
}
