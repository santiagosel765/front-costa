import { isDevMode } from '@angular/core';

import { AuthContextModule } from '../models/auth-context.models';

const MODULE_ROUTES: Record<string, string | null> = {
  CORE_AUTH: '/main/auth/users',
  ORG: '/main/org',
  CONFIG: '/main/config',
  INVENTORY: '/main/inventory',
  AR: '/main/quotes',
  AP: '/main/purchases',
  PURCHASE: '/main/purchases',
  SALES: '/main/quotes',
  ACCOUNTING: '/main/welcome',
  BANKS: '/main/welcome',
  REPORTING_BI: '/main/welcome',
  AUDIT_LOGS: '/main/welcome',
  PRODUCT: '/main/products',
  CATEGORY: '/main/categories',
  CLIENT: '/main/clients',
  CLIENTES: '/main/clients',
  PROVIDER: '/main/providers',
  PROVEEDORES: '/main/providers',
  QUOTE: '/main/quotes',
  DATOS_MAESTROS: null,
  DEVOLUCIONES: null,
  GESTION_DE_PRECIOS: null,
  GESTION_DOCUMENTAL: null,
  INTEGRACIONES: null,
  NOTIFICACIONES: null,
  ORDENES_DE_SERVICIO: null,
  PRODUCCION: null,
  PRODUCTOS_Y_SERVICIOS: '/main/products',
  PUNTO_DE_VENTA: null,
  WMS: null,
  WORKFLOWS: null,
};

export const MODULE_ALIAS: Record<string, string> = {
  AUTH_CORE: 'CORE_AUTH',
  CORE_DE_AUTENTICACION: 'CORE_AUTH',
  CORE_DE_AUTENTICACION_Y_PERMISOS: 'CORE_AUTH',
  ORGANIZACION: 'ORG',
  ORG_BRANCH: 'ORG',
  SUCURSALES_Y_ORGANIZACIONES: 'ORG',
  ORGANIZATION: 'ORG',
  HUB_ORGANIZACION: 'ORG',
  HUB_ORGANIZATION: 'ORG',
  ORG_HUB: 'ORG',
  CONFIGURACION: 'CONFIG',
  INVENTARIO: 'INVENTORY',
  INVENTORIES: 'INVENTORY',
  DATOS_MAESTROS: 'INVENTORY',
  CLIENTS: 'CLIENT',
  CLIENTES: 'CLIENT',
  SUPPLIERS: 'PROVIDER',
  PROVEEDORES: 'PROVIDER',
  PROVIDERS: 'PROVIDER',
  QUOTES: 'QUOTE',
  COTIZACIONES: 'QUOTE',
  PURCHASES: 'PURCHASE',
  PURCHASE_ORDERS: 'PURCHASE',
  COMPRAS: 'PURCHASE',
  PRODUCTS: 'PRODUCT',
  PRODUCTOS: 'PRODUCT',
  PRODUCTOS_Y_SERVICIOS: 'PRODUCT',
  CATEGORIES: 'CATEGORY',
  CATEGORIAS: 'CATEGORY',
  CUENTAS_POR_COBRAR: 'AR',
  CUENTAS_POR_PAGAR: 'AP',
  VENTAS: 'SALES',
  CONTABILIDAD: 'ACCOUNTING',
  BANCOS: 'BANKS',
  REPORTES_Y_BI: 'REPORTING_BI',
  AUDITORIA_Y_LOGS: 'AUDIT_LOGS',
};

export interface ModuleUiManifest {
  route: string | null;
  label: string;
  icon: string;
  disabled: boolean;
  disabledReason?: string | null;
}

export function normalizeModuleName(name?: string | null): string | undefined {
  if (!name) {
    return undefined;
  }

  const sanitized = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return MODULE_ALIAS[sanitized] ?? sanitized;
}

export function resolveModuleRoute(moduleKey?: string | null): string | null {
  const normalizedKey = normalizeModuleName(moduleKey);
  if (!normalizedKey) {
    return null;
  }

  return MODULE_ROUTES[normalizedKey] ?? null;
}

export function resolveModuleRouteReason(moduleKey?: string | null): string | null {
  const normalizedKey = normalizeModuleName(moduleKey);
  if (!normalizedKey) {
    return 'empty-module-key';
  }

  if (!(normalizedKey in MODULE_ROUTES)) {
    return 'not-mapped';
  }

  if (!MODULE_ROUTES[normalizedKey]) {
    return 'route-not-configured';
  }

  return null;
}

const MODULE_LABELS: Record<string, string> = {
  CORE_AUTH: 'Core de Autenticación',
  ORG: 'Organización',
  CONFIG: 'Configuración',
  INVENTORY: 'Inventario',
  AR: 'Cuentas por Cobrar',
  AP: 'Cuentas por Pagar',
  PURCHASE: 'Compras',
  SALES: 'Ventas',
  ACCOUNTING: 'Contabilidad',
  BANKS: 'Bancos',
  REPORTING_BI: 'Reporting y BI',
  AUDIT_LOGS: 'Auditoría y Logs',
};

const MODULE_ICONS: Record<string, string> = {
  CORE_AUTH: 'safety',
  ORG: 'apartment',
  CONFIG: 'setting',
  INVENTORY: 'database',
  AR: 'wallet',
  AP: 'reconciliation',
  PURCHASE: 'shopping-cart',
  SALES: 'shop',
  ACCOUNTING: 'calculator',
  BANKS: 'bank',
  REPORTING_BI: 'bar-chart',
  AUDIT_LOGS: 'audit',
  PRODUCT: 'shopping',
  CATEGORY: 'tags',
  CLIENT: 'team',
  PROVIDER: 'contacts',
  QUOTE: 'file-search',
};

export function resolveModulePresentation(module: AuthContextModule): ModuleUiManifest {
  const key = normalizeModuleName(module.moduleKey) ?? module.moduleKey;
  const route = resolveModuleRoute(key);

  if (!route) {
    const disabledReason = resolveModuleRouteReason(key) ?? 'route-not-configured';

    if (isDevMode()) {
      console.warn('[module-route-map] Unresolved module route:', {
        rawKey: module.moduleKey,
        normalizedKey: key,
        reason: disabledReason,
      });
    }

    return {
      route: null,
      icon: module.icon || 'appstore',
      label: module.name || 'Disponible (pendiente configuración)',
      disabled: true,
      disabledReason,
    };
  }

  return {
    route,
    icon: module.icon || MODULE_ICONS[key] || 'appstore',
    label: module.name || MODULE_LABELS[key] || key,
    disabled: false,
    disabledReason: null,
  };
}
