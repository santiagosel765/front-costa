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
};

export const MODULE_ROUTE_MAP: Record<string, string> = {
  CORE_DE_AUTENTICACION: '/main/auth/users',
  INVENTORY: '/main/inventory',
  PRODUCT: '/main/products',
  CATEGORY: '/main/categories',
  CLIENT: '/main/clients',
  PROVIDER: '/main/providers',
  QUOTE: '/main/quotes',
  PURCHASE: '/main/purchases',
};

export const MODULE_LABEL_MAP: Record<string, string> = {
  CORE_DE_AUTENTICACION: 'Core de Autenticación',
  INVENTORY: 'Inventario',
  PRODUCT: 'Productos',
  CATEGORY: 'Categorías',
  CLIENT: 'Clientes',
  PROVIDER: 'Proveedores',
  QUOTE: 'Cotizaciones',
  PURCHASE: 'Compras',
};

export const MODULE_ICON_MAP: Record<string, string> = {
  CORE_DE_AUTENTICACION: 'safety',
  INVENTORY: 'database',
  PRODUCT: 'shopping',
  CATEGORY: 'tags',
  CLIENT: 'team',
  PROVIDER: 'contacts',
  QUOTE: 'file-search',
  PURCHASE: 'shopping-cart',
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
