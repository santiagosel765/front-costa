import { AppTableSortOrder } from '../../shared/components/app-data-table/app-data-table.models';

export interface CatalogQuery {
  page: number;
  size: number;
  search?: string;
  sortField?: string | null;
  sortOrder?: AppTableSortOrder;
}

export interface AuditFields {
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface TaxRecord extends AuditFields {
  id: string;
  name: string;
  rate: number;
  isPercentage: boolean;
  active: boolean;
}

export interface PaymentMethodRecord extends AuditFields {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface DocumentTypeRecord extends AuditFields {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface ParameterRecord extends AuditFields {
  id: string;
  code: string;
  value: string;
  description?: string;
  active: boolean;
}

export interface TaxDto {
  name: string;
  rate: number;
  isPercentage?: boolean;
  active: boolean;
}

export interface PaymentMethodDto {
  name: string;
  description?: string;
  active: boolean;
}

export interface DocumentTypeDto {
  code: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface ParameterDto {
  code: string;
  value: string;
  description?: string;
  active: boolean;
}

export interface NormalizedListResponse<T> {
  data: T[];
  total: number;
}

export function readStringField(source: Record<string, unknown>, camelKey: string, snakeKey: string): string | undefined {
  const value = source[camelKey] ?? source[snakeKey];
  return typeof value === 'string' ? value : undefined;
}

export function readBooleanField(source: Record<string, unknown>, camelKey: string, snakeKey: string, fallback = false): boolean {
  const value = source[camelKey] ?? source[snakeKey];
  return typeof value === 'boolean' ? value : fallback;
}

export function readNumberField(source: Record<string, unknown>, camelKey: string, snakeKey: string, fallback = 0): number {
  const value = source[camelKey] ?? source[snakeKey];
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function readAuditFields(source: Record<string, unknown>): AuditFields {
  return {
    createdAt: readStringField(source, 'createdAt', 'created_at'),
    createdBy: readStringField(source, 'createdBy', 'created_by'),
    updatedAt: readStringField(source, 'updatedAt', 'updated_at'),
    updatedBy: readStringField(source, 'updatedBy', 'updated_by'),
  };
}

export function normalizeListResponse<T>(response: unknown, mapItem: (item: unknown) => T): NormalizedListResponse<T> {
  const source = (response ?? {}) as { data?: unknown; items?: unknown; total?: unknown };
  const dataNode = source.data;

  let items: unknown[] = [];
  let totalSource: unknown = source.total;

  if (Array.isArray(dataNode)) {
    items = dataNode;
  } else if (dataNode && typeof dataNode === 'object') {
    const nestedData = dataNode as { items?: unknown; data?: unknown; total?: unknown };
    if (Array.isArray(nestedData.items)) {
      items = nestedData.items;
    } else if (Array.isArray(nestedData.data)) {
      items = nestedData.data;
    }
    if (totalSource == null) {
      totalSource = nestedData.total;
    }
  } else if (Array.isArray(source.items)) {
    items = source.items;
  }

  const total = typeof totalSource === 'number' ? totalSource : items.length;

  return {
    data: items.map((item) => mapItem(item)),
    total,
  };
}

export interface CatalogDto {
  code?: string;
  name?: string;
  description?: string;
  active: boolean;
  rate?: number;
  value?: string;
  address?: string;
  branchId?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface CatalogRecord extends CatalogDto {
  id: string;
  updatedAt?: string;
}

export function normalizeCatalogRecord(record: CatalogRecord): CatalogRecord {
  const legacyUpdatedAt = (record as CatalogRecord & { updated_at?: string }).updated_at;

  return {
    ...record,
    updatedAt: record.updatedAt ?? legacyUpdatedAt,
  };
}
