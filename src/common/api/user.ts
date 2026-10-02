import { isAxiosError } from 'axios'
import { sklandCache } from '../sklandCache'
import { getData, postData } from './client'
export type { ApiResponse } from './client'

export interface CurrentUser {
  id: number
  username: string
  email: string | null
  phone: string | null
  isAdmin: boolean
  createdAt: string
  updatedAt: string
  hypergryphAccount: { phone: string; userId: number; createdAt: string; updatedAt: string } | null
  postAdmin: {
    id: number
    email: string
    organization: string
    role: string
    userId: number | null
    createdAt: string
    updatedAt: string
  } | null
}

export async function getCurrentUserAPI(signal?: AbortSignal): Promise<CurrentUser | null> {
  try {
    const user = await getData<CurrentUser>('user/current', undefined, { signal })
    if (!user || typeof user.id !== 'number' || typeof user.username !== 'string') {
      throw new Error('Invalid current user response')
    }
    return user
  } catch (error) {
    if (isAxiosError(error) && [401, 404].includes(error.response?.status ?? 0)) {
      sklandCache.clear()
      return null
    }
    throw error
  }
}

export async function logoutAPI(): Promise<void> {
  await postData('user/logout')
  sklandCache.clear()
}
