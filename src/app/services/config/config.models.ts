import { AppTableSortOrder } from '../../shared/components/app-data-table/app-data-table.models';

export interface CatalogQuery {
  page: number;
  size: number;
  search?: string;
  sortField?: string | null;
  sortOrder?: AppTableSortOrder;
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
