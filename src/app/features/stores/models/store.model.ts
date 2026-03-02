export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  status: 'pending' | 'approved' | 'rejected';
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreRequest {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface StoreListResponse {
  stores: Store[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}