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
  name: string;
  active: boolean;
}

export interface CatalogRecord extends CatalogDto {
  id: string;
  updatedAt?: string;
  updated_at?: string;
}
