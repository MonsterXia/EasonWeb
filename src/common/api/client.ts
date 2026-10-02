import type { AxiosRequestConfig } from 'axios'
import gatewayManager from '../gatewayManager/gatewayManager'

export interface ApiResponse<T> {
  message: string
  data: T
  httpStatus: number
}

export const ACCOUNT_REQUEST_TIMEOUT = 60000
const gateway = gatewayManager.getInstance()

// Health checks use the transport directly because they have no data envelope.
export async function getData<T>(
  path: string,
  params?: Record<string, unknown> | URLSearchParams,
  config?: AxiosRequestConfig,
): Promise<T> {
  return (await gateway.get<ApiResponse<T>>(gateway.buildStandardURL(path), params, config)).data
}

export async function postData<T = null>(
  path: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return (await gateway.post<ApiResponse<T>>(gateway.buildStandardURL(path), body, config)).data
}
