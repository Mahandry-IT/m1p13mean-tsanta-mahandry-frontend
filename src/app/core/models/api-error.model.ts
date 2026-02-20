export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
  url?: string;
}

