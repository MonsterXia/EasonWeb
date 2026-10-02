import { getData, ACCOUNT_REQUEST_TIMEOUT } from './client'
import type { GameAccount } from './accounts'
import { rememberOverview } from '../resourceRecovery'

export interface OverviewMetric {
  key: string
  group: 'daily' | 'base' | 'collection'
  current: number | null
  total: number | null
  recoveryAt?: number | null
  recovery?: { value: number; at: number; intervalSeconds: number }
}
export interface GameOverview {
  account: GameAccount
  fetchedAt: number
  calculatedAt?: number
  updatedAt: number | null
  profile: {
    level: number | null
    worldLevel: number | null
    registeredAt: number | null
    lastOnlineAt: number | null
    mainProgress: string | null
    endministratorGender?: 'male' | 'female' | null
  }
  metrics: OverviewMetric[]
  sections?: {
    key: string
    items: {
      id: string
      name: string | null
      nameKey?: string
      operatorId?: string
      level: number | null
      status: 'idle' | 'working' | 'complete' | 'locked' | 'unknown'
      current: number | null
      total: number | null
      completeAt: number | null
      subtitle?: string | null
      rating?: string | null
    }[]
  }[]
  operators:
    | {
        id: string
        name: string
        level: number | null
        phase: number | null
        rarity?: number | null
        potential?: number | null
        profession?: string | null
        element?: string | null
      }[]
    | null
}
export async function gameOverviewAPI(
  account: GameAccount,
  signal?: AbortSignal,
): Promise<GameOverview> {
  const data = await getData<GameOverview>(
    'game/hypergryph/account/overview',
    { appCode: account.appCode, uid: account.uid, gameId: account.gameId },
    { timeout: ACCOUNT_REQUEST_TIMEOUT, signal },
  )
  rememberOverview(data)
  return data
}
