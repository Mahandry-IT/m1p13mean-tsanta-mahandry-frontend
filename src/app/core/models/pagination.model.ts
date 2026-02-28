export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export interface PaginatedResponse<TItem> {
  items: TItem[];
  pagination: PaginationMeta;
}

export interface ApiResponse<TData> {
  success: boolean;
  message: string;
  data: TData;
}

