import type { AxiosRequestConfig } from 'axios'
import gatewayManager from '../gatewayManager/gatewayManager'
import { responseData } from './validation'

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
  return responseData<T>(await gateway.get<unknown>(gateway.buildStandardURL(path), params, config))
}

export async function postData<T = null>(
  path: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return responseData<T>(await gateway.post<unknown>(gateway.buildStandardURL(path), body, config))
}
