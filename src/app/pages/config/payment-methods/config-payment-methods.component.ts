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

interface PaymentMethodRow {
  name: string;
  description: string;
  status: string;
}

@Component({
  selector: 'app-config-payment-methods',
  standalone: true,
  imports: [CommonModule, FormsModule, NzCardModule, NzButtonModule, NzModalModule, NzInputModule, AppDataTableComponent],
  templateUrl: './config-payment-methods.component.html',
  styleUrls: ['./config-payment-methods.component.css'],
})
export class ConfigPaymentMethodsComponent {
  readonly isModalVisible = signal(false);
  paymentMethodName = '';

  readonly columns: AppDataTableColumn<PaymentMethodRow>[] = [
    { key: 'name', title: 'Nombre' },
    { key: 'description', title: 'Descripción' },
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
    this.paymentMethodName = '';
    this.closeModal();
  }
}
