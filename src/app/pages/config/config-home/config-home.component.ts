import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';

interface ConfigModuleCard {
  title: string;
  description: string;
  route: string;
  status: 'Listo' | 'Pendiente';
}

@Component({
  selector: 'app-config-home',
  standalone: true,
  imports: [CommonModule, RouterLink, NzCardModule, NzButtonModule, NzTagModule],
  templateUrl: './config-home.component.html',
  styleUrls: ['./config-home.component.css'],
})
export class ConfigHomeComponent {
  readonly cards: ConfigModuleCard[] = [
    {
      title: 'Monedas',
      description: 'Administra catálogo de monedas, símbolo, decimales y moneda funcional.',
      route: './currencies',
      status: 'Listo',
    },
    {
      title: 'Impuestos',
      description: 'Define tipos de impuesto y tasas para operaciones de venta y compra.',
      route: './taxes',
      status: 'Pendiente',
    },
    {
      title: 'Métodos de pago',
      description: 'Gestiona medios de pago disponibles para tus transacciones.',
      route: './payment-methods',
      status: 'Pendiente',
    },
    {
      title: 'Tipos de documento',
      description: 'Configura documentos usados para identificar transacciones y registros.',
      route: './document-types',
      status: 'Pendiente',
    },
    {
      title: 'Parámetros',
      description: 'Centraliza parámetros de negocio y ajustes operativos generales.',
      route: './parameters',
      status: 'Pendiente',
    },
  ];
}
