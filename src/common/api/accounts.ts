import { isAxiosError } from 'axios'
import gatewayManager from '../gatewayManager/gatewayManager'
import type { ApiResponse } from './user'

const gateway = gatewayManager.getInstance()
const url = (path: string) => gateway.buildStandardURL(path)
async function post<T = null>(path: string, body?: unknown): Promise<T> {
  return (await gateway.post<ApiResponse<T>>(url(path), body, { timeout: 60000 })).data
}
export const loginAPI = (username: string, password: string) => post('user/login', { username, password })
export const registerAPI = (data: { username: string; email: string; password: string; registrationCode: string }) => post('user/register', data)
export const usernameExistsAPI = async (username: string) => (await gateway.get<ApiResponse<boolean>>(url(`user/username/${encodeURIComponent(username)}/exist`))).data
export const registrationCodeAPI = (email: string) => post('user/email/verify', { email, type: 'register' })
export const resetCodeAPI = (username: string, email: string) => post('user/password/reset/code', { username, email })
export const resetPasswordAPI = (data: { username: string; email: string; code: string; password: string }) => post('user/password/reset', data)
export const postLoginAPI = (email: string, password: string) => post('post/admin/login', { email, password })
export const bindPostAPI = () => post('post/admin/binding')
export const unbindPostAPI = () => gateway.delete(url('post/admin/binding'))
export const hypergryphSmsAPI = (phone: string) => post('game/hypergryph/account/sms', { phone })
export const bindHypergryphAPI = (data: { phone: string; method: 'password' | 'sms'; password?: string; code?: string }) => post('game/hypergryph/account', data)
export const unbindHypergryphAPI = () => gateway.delete(url('game/hypergryph/account'))
export interface GameAccount { appCode: string; nickName: string; uid: string; gameId: string }
export interface CheckInResults { checkInResults: string[]; errorResults: (GameAccount & { error: string })[] }
export const gameAccountsAPI = async () => (await gateway.get<ApiResponse<GameAccount[]>>(url('game/hypergryph/account/games'), undefined, { timeout: 60000 })).data
export const checkInAPI = () => post<CheckInResults>('game/hypergryph/account/check-in')

export function apiError(error: unknown): string {
  if (!isAxiosError(error)) return error instanceof Error ? error.message : '操作失败，请重试。'
  const status = error.response?.status
  if (status === 401) return '登录状态已失效，请重新登录对应账号。'
  if (status === 403) return '账号或密码错误，或当前操作未获授权。'
  if (status === 409) return '账号已存在或已绑定，请刷新资料并检查账号。'
  if (status === 429) return '请求过于频繁，请等待验证码有效期结束后重试。'
  if (status === 502) return '鹰角或森空岛认证失败，请检查验证码、密码或重新登录关联账号。'
  if (status === 400) return typeof error.response?.data?.error === 'string' && error.response.data.error !== 'Unknown error'
    ? error.response.data.error : '输入或验证码无效，请检查后重试。'
  return '服务暂时不可用，请稍后重试。'
}
export function passwordError(password: string): string {
  if (password.length < 6 || new TextEncoder().encode(password).length > 72) return '密码需至少 6 个字符，且不超过 72 个 UTF-8 字节。'
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return '密码需包含大写字母、小写字母和特殊字符（如 !@#$%）。'
  return ''
}
