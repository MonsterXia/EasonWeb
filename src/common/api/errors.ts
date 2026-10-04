import { isAxiosError } from 'axios'

export class ApiResponseError extends Error {
  constructor() {
    super('Invalid API response')
    this.name = 'ApiResponseError'
  }
}

export type ApiFailureKind =
  | 'session'
  | 'authorization'
  | 'rateLimit'
  | 'upstream'
  | 'network'
  | 'invalidResponse'
  | 'unavailable'

export function apiFailureKind(error: unknown): ApiFailureKind {
  if (error instanceof ApiResponseError) return 'invalidResponse'
  if (isAxiosError(error)) {
    if (!error.response) return 'network'
    switch (error.response.status) {
      case 401:
        return 'session'
      case 403:
        return 'authorization'
      case 429:
        return 'rateLimit'
      case 502:
        return 'upstream'
    }
  }
  return 'unavailable'
}
