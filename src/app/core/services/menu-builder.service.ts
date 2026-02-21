import { Injectable } from '@angular/core';

export interface MenuItemConfig {
  label: string;
  route: string;
  icon: string;
  requiredModule?: string;
}

export interface MenuSectionConfig {
  title: string;
  icon: string;
  openByDefault?: boolean;
  requiredModule?: string;
  items: MenuItemConfig[];
}

export interface MenuSection {
  title: string;
  icon: string;
  openByDefault: boolean;
  items: MenuItemConfig[];
}

@Injectable({
  providedIn: 'root',
})
export class MenuBuilderService {
  private readonly menuConfig: MenuSectionConfig[] = [
    {
      title: 'Panel Principal',
      icon: 'dashboard',
      openByDefault: true,
      items: [
        {
          label: 'Bienvenido',
          route: '/main/welcome',
          icon: 'home',
        },
      ],
    },
    {
      title: 'Gestión de Inventario',
      icon: 'shop',
      requiredModule: 'INVENTORY',
      items: [
        {
          label: 'Categorías',
          route: '/main/categories/panel',
          icon: 'tags',
          requiredModule: 'INVENTORY',
        },
        {
          label: 'Productos',
          route: '/main/products/panel',
          icon: 'shopping',
          requiredModule: 'INVENTORY',
        },
        {
          label: 'Inventario',
          route: '/main/inventory/panel',
          icon: 'database',
          requiredModule: 'INVENTORY',
        },
      ],
    },
    {
      title: 'Administración',
      icon: 'setting',
      requiredModule: 'ADMIN',
      items: [
        {
          label: 'Empresas',
          route: '/main/companies/panel',
          icon: 'bank',
          requiredModule: 'ADMIN',
        },
        {
          label: 'Usuarios',
          route: '/main/users/panel',
          icon: 'team',
          requiredModule: 'ADMIN',
        },
      ],
    },
    {
      title: 'Core de Autenticación',
      icon: 'safety',
      requiredModule: 'CORE_DE_AUTENTICACION',
      items: [
        {
          label: 'Panel',
          route: '/main/auth',
          icon: 'appstore',
          requiredModule: 'CORE_DE_AUTENTICACION',
        },
      ],
    },
    {
      title: 'Reportes y Análisis',
      icon: 'bar-chart',
      requiredModule: 'REPORTS',
      items: [
        {
          label: 'Reportes de Ventas',
          route: '/main/reports/sales',
          icon: 'line-chart',
          requiredModule: 'REPORTS',
        },
        {
          label: 'Reportes de Envíos',
          route: '/main/reports/shipments',
          icon: 'car',
          requiredModule: 'REPORTS',
        },
        {
          label: 'Solicitudes a Proveedores',
          route: '/main/reports/supplier-requests',
          icon: 'interaction',
          requiredModule: 'REPORTS',
        },
        {
          label: 'Clientes Cotizados',
          route: '/main/reports/client-quotes',
          icon: 'file-text',
          requiredModule: 'REPORTS',
        },
      ],
    },
    {
      title: 'Ventas y Operaciones',
      icon: 'dollar',
      items: [
        {
          label: 'Nueva Venta',
          route: '/main/sales/new',
          icon: 'plus-circle',
          requiredModule: 'SALES',
        },
        {
          label: 'Historial de Ventas',
          route: '/main/sales/history',
          icon: 'history',
          requiredModule: 'SALES',
        },
        {
          label: 'Cotizaciones',
          route: '/main/quotes/panel',
          icon: 'file-search',
          requiredModule: 'QUOTES',
        },
      ],
    },
    {
      title: 'Proveedores',
      icon: 'contacts',
      items: [
        {
          label: 'Lista de Proveedores',
          route: '/main/suppliers/panel',
          icon: 'user',
          requiredModule: 'SUPPLIERS',
        },
        {
          label: 'Órdenes de Compra',
          route: '/main/purchase-orders/panel',
          icon: 'shopping-cart',
          requiredModule: 'PURCHASES',
        },
      ],
    },
    {
      title: 'Configuración',
      icon: 'tool',
      requiredModule: 'SETTINGS',
      items: [
        {
          label: 'Mi Perfil',
          route: '/main/settings/profile',
          icon: 'user',
          requiredModule: 'SETTINGS',
        },
        {
          label: 'Configuración General',
          route: '/main/settings/company',
          icon: 'bank',
          requiredModule: 'SETTINGS',
        },
        {
          label: 'Respaldos',
          route: '/main/settings/backup',
          icon: 'cloud-download',
          requiredModule: 'SETTINGS',
        },
      ],
    },
  ];

  buildMenu(enabledModules: string[]): MenuSection[] {
    const normalizedModules = new Set((enabledModules || []).map((module) => module.toUpperCase()));

    return this.menuConfig
      .map((section) => this.buildSection(section, normalizedModules))
      .filter((section): section is MenuSection => section !== null && section.items.length > 0);
  }

  private buildSection(
    section: MenuSectionConfig,
    enabledModules: Set<string>,
  ): MenuSection | null {
    if (section.requiredModule && !enabledModules.has(section.requiredModule.toUpperCase())) {
      return null;
    }

    const items = section.items.filter((item) =>
      !item.requiredModule || enabledModules.has(item.requiredModule.toUpperCase()),
    );

    if (items.length === 0) {
      return null;
    }

    return {
      title: section.title,
      icon: section.icon,
      items,
      openByDefault: section.openByDefault ?? false,
    };
  }
}
