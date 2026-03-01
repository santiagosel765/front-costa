export interface PagedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  message: string;
  status: number;
  field?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

export interface NormalizedPagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export function unwrapApiResponse<T>(payload: ApiResponse<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiResponse<T>).data;
  }

  return payload as T;
}

export function normalizePagedResponse<T>(payload: unknown, fallback: { page: number; size: number }): NormalizedPagedResponse<T> {
  const source = (payload ?? {}) as Record<string, unknown>;
  const directData = source['data'];
  const directItems = source['items'];

  const hasNestedItems = directData && typeof directData === 'object' && !Array.isArray(directData);
  const nested = (hasNestedItems ? directData : {}) as Record<string, unknown>;

  const itemsCandidate =
    (Array.isArray(directData) ? directData : undefined)
    ?? (Array.isArray(nested['items']) ? (nested['items'] as unknown[]) : undefined)
    ?? (Array.isArray(directItems) ? (directItems as unknown[]) : []);

  const totalCandidate = source['total'] ?? nested['total'];
  const pageCandidate = source['page'] ?? nested['page'];
  const sizeCandidate = source['size'] ?? nested['size'];
  const totalPagesCandidate = source['totalPages'] ?? source['total_pages'] ?? nested['totalPages'] ?? nested['total_pages'];

  const total = Number.isFinite(Number(totalCandidate)) ? Number(totalCandidate) : itemsCandidate.length;
  const page = Number.isFinite(Number(pageCandidate)) && Number(pageCandidate) > 0 ? Number(pageCandidate) : fallback.page;
  const size = Number.isFinite(Number(sizeCandidate)) && Number(sizeCandidate) > 0 ? Number(sizeCandidate) : fallback.size;
  const totalPages = Number.isFinite(Number(totalPagesCandidate)) && Number(totalPagesCandidate) > 0
    ? Number(totalPagesCandidate)
    : Math.max(1, Math.ceil(total / Math.max(1, size)));

  return {
    items: itemsCandidate as T[],
    total,
    page,
    size,
    totalPages,
  };
}
