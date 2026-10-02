import { isAxiosError } from 'axios'
import { i18n, tr } from '../../i18n'
import gatewayManager from '../gatewayManager/gatewayManager'
import type { ApiResponse } from './user'

const gateway = gatewayManager.getInstance()
const url = (path: string) => gateway.buildStandardURL(path)
async function post<T = null>(path: string, body?: unknown): Promise<T> {
  return (await gateway.post<ApiResponse<T>>(url(path), body, { timeout: 60000 })).data
}
export const loginAPI = (username: string, password: string) =>
  post('user/login', { username, password })
export const registerAPI = (data: {
  username: string
  email: string
  password: string
  registrationCode: string
}) => post('user/register', data)
export const usernameExistsAPI = async (username: string) =>
  (
    await gateway.get<ApiResponse<boolean>>(
      url(`user/username/${encodeURIComponent(username)}/exist`),
    )
  ).data
export const registrationCodeAPI = (email: string) =>
  post('user/email/verify', { email, type: 'register' })
export const resetCodeAPI = (username: string, email: string) =>
  post('user/password/reset/code', { username, email })
export const resetPasswordAPI = (data: {
  username: string
  email: string
  code: string
  password: string
}) => post('user/password/reset', data)
export const postLoginAPI = (email: string, password: string) =>
  post('post/admin/login', { email, password })
export const bindPostAPI = () => post('post/admin/binding')
export const unbindPostAPI = () => gateway.delete(url('post/admin/binding'))
export const hypergryphSmsAPI = (phone: string) => post('game/hypergryph/account/sms', { phone })
export const bindHypergryphAPI = (data: {
  phone: string
  method: 'password' | 'sms'
  password?: string
  code?: string
}) => post('game/hypergryph/account', data)
export const unbindHypergryphAPI = () => gateway.delete(url('game/hypergryph/account'))
export interface GameAccount {
  appCode: string
  nickName: string
  uid: string
  gameId: string
  serverName?: string
}
export interface CheckInResults {
  checkInResults: string[]
  errorResults: (GameAccount & { error: string })[]
}
export const gameAccountsAPI = async (signal?: AbortSignal) =>
  (
    await gateway.get<ApiResponse<GameAccount[]>>(url('game/hypergryph/account/games'), undefined, {
      signal,
      timeout: 60000,
    })
  ).data
export const checkInAPI = () => post<CheckInResults>('game/hypergryph/account/check-in')

// Server messages are external text; show a localized fallback when Chinese has no English equivalent.
function canDisplayMessage(message: string): boolean {
  return i18n.global.locale.value !== 'en' || !/[\u3400-\u9fff]/.test(message)
}

export function apiError(error: unknown): string {
  if (!isAxiosError(error)) {
    return error instanceof Error && canDisplayMessage(error.message)
      ? error.message
      : tr('account.error.failed')
  }
  const status = error.response?.status
  if (status === 401) return tr('account.error.expired')
  if (status === 403) return tr('account.error.unauthorized')
  if (status === 409) return tr('account.error.conflict')
  if (status === 429) return tr('account.error.rateLimit')
  if (status === 502) return tr('account.error.upstream')
  if (status === 400)
    return typeof error.response?.data?.error === 'string' &&
      error.response.data.error !== 'Unknown error' &&
      canDisplayMessage(error.response.data.error)
      ? error.response.data.error
      : tr('account.error.invalidInput')
  return tr('account.error.unavailable')
}
export function passwordErrorKey(password: string): string {
  if (password.length < 6 || new TextEncoder().encode(password).length > 72)
    return 'account.error.passwordLength'
  if (
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[!@#$%^&*(),.?":{}|<>]/.test(password)
  )
    return 'account.error.passwordComplexity'
  return ''
}

export function passwordError(password: string): string {
  const key = passwordErrorKey(password)
  return key ? tr(key) : ''
}
