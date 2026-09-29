/** Django REST framework's paginated response shape. */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Shape of a Django error response body. */
export interface ApiError {
  detail?: string;
  [field: string]: string | string[] | undefined;
} 