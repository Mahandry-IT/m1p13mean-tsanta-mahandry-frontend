export const environment = { production: true, apiUrl: 'https://api.example.com' };
export interface ApiResponse<T> { data: T; message?: string; errors?: any; }

