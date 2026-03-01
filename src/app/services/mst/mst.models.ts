export interface WrappedList<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface ListQuery {
  page: number;
  size: number;
  search?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export function mapWrappedList<T>(response: unknown, fallback: { page: number; size: number }): WrappedList<T> {
  const source = (response ?? {}) as Record<string, unknown>;
  const data = Array.isArray(source['data']) ? (source['data'] as T[]) : [];
  const total = Number(source['total'] ?? data.length);
  const page = Number(source['page'] ?? fallback.page);
  const size = Number(source['size'] ?? fallback.size);
  const totalPages = Number(source['totalPages'] ?? Math.max(1, Math.ceil(total / Math.max(1, size))));

  return { data, total, page, size, totalPages };
}

export function unwrapData<T>(response: unknown): T {
  const source = (response ?? {}) as Record<string, unknown>;
  return (source['data'] as T) ?? (response as T);
}

export function queryToParams(query: ListQuery): Record<string, string | number | boolean> {
  return Object.entries(query).reduce<Record<string, string | number | boolean>>((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value as string | number | boolean;
    }
    return acc;
  }, {});
}
