export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Response) {
    return new ApiError(
      'API request failed',
      error.status,
      'API_ERROR'
    );
  }

  return new ApiError(
    'An unexpected error occurred',
    500,
    'UNKNOWN_ERROR'
  );
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof Error && 
    ['NetworkError', 'NetworkRequestFailed'].includes(error.name);
} 