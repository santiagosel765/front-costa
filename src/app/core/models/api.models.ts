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

export function unwrapApiResponse<T>(payload: ApiResponse<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiResponse<T>).data;
  }

  return payload as T;
}
