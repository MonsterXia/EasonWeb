import { isAxiosError } from 'axios'
import gatewayManager from '../gatewayManager/gatewayManager'

export interface ApiResponse<T> {
  message: string
  data: T
  httpStatus: number
}

export interface CurrentUser {
  id: number
  username: string
  email: string | null
  phone: string | null
  isAdmin: boolean
  createdAt: string
  updatedAt: string
  hypergryphAccount: { phone: string; userId: number; createdAt: string; updatedAt: string } | null
  postAdmin: { id: number; email: string; organization: string; role: string; userId: number | null; createdAt: string; updatedAt: string } | null
}

const gateway = gatewayManager.getInstance()

export async function getCurrentUserAPI(signal?: AbortSignal): Promise<CurrentUser | null> {
  try {
    const response = await gateway.get<ApiResponse<CurrentUser>>(
      gateway.buildStandardURL('user/current'), undefined, { signal },
    )
    const user = response.data
    if (!user || typeof user.id !== 'number' || typeof user.username !== 'string') {
      throw new Error('Invalid current user response')
    }
    return user
  } catch (error) {
    if (isAxiosError(error) && [401, 404].includes(error.response?.status ?? 0)) return null
    throw error
  }
}

export async function logoutAPI(): Promise<void> {
  await gateway.post<ApiResponse<null>>(gateway.buildStandardURL('user/logout'))
}
