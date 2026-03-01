import { AuthContextModule } from '../models/auth-context.models';

export const MODULE_ALIAS: Record<string, string> = {
  CLIENTS: 'CLIENT',
  CLIENTES: 'CLIENT',
  SUPPLIERS: 'PROVIDER',
  PROVEEDORES: 'PROVIDER',
  PROVIDERS: 'PROVIDER',
  QUOTES: 'QUOTE',
  COTIZACIONES: 'QUOTE',
  VENTAS: 'QUOTE',
  PURCHASES: 'PURCHASE',
  COMPRAS: 'PURCHASE',
  PURCHASE_ORDERS: 'PURCHASE',
  PRODUCTS: 'PRODUCT',
  PRODUCTOS: 'PRODUCT',
  PRODUCTOS_Y_SERVICIOS: 'PRODUCT',
  CATEGORIES: 'CATEGORY',
  CATEGORIAS: 'CATEGORY',
  INVENTORIES: 'INVENTORY',
  INVENTARIO: 'INVENTORY',
  CONFIGURACION: 'CONFIG',
  CONFIG: 'CONFIG',
  ORGANIZACION: 'ORG',
  ORGANIZATION: 'ORG',
};

export interface ModuleUiManifest {
  route: string;
  label: string;
  icon: string;
}

export const MODULE_UI_MANIFEST: Record<string, ModuleUiManifest> = {
  CORE_DE_AUTENTICACION: { route: '/main/auth/users', label: 'Core de Autenticación', icon: 'safety' },
  INVENTORY: { route: '/main/inventory', label: 'Inventario', icon: 'database' },
  PRODUCT: { route: '/main/products', label: 'Productos', icon: 'shopping' },
  CATEGORY: { route: '/main/categories', label: 'Categorías', icon: 'tags' },
  CLIENT: { route: '/main/clients', label: 'Clientes', icon: 'team' },
  PROVIDER: { route: '/main/providers', label: 'Proveedores', icon: 'contacts' },
  QUOTE: { route: '/main/quotes', label: 'Cotizaciones', icon: 'file-search' },
  PURCHASE: { route: '/main/purchases', label: 'Compras', icon: 'shopping-cart' },
  CONFIG: { route: '/main/config', label: 'Configuración', icon: 'setting' },
  ORG: { route: '/main/org/branches', label: 'Sucursales y Organizaciones', icon: 'apartment' },
};

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

export function resolveModulePresentation(module: AuthContextModule): ModuleUiManifest {
  const key = normalizeModuleName(module.key) ?? module.key;
  const fromManifest = MODULE_UI_MANIFEST[key];

  if (!fromManifest) {
    return {
      route: '/main/welcome',
      icon: 'appstore',
      label: module.label || 'Disponible (pendiente configuración)',
    };
  }

  return {
    route: module.baseRoute || fromManifest.route,
    icon: module.icon || fromManifest.icon,
    label: module.label || fromManifest.label,
  };
}
