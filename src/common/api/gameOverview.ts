import { getData, ACCOUNT_REQUEST_TIMEOUT } from './client'
import type { GameAccount } from './accounts'

export interface OverviewMetric {
  key: string
  group: 'daily' | 'base' | 'collection'
  current: number | null
  total: number | null
  recoveryAt?: number | null
}
export interface GameOverview {
  account: GameAccount
  fetchedAt: number
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
  operators: { id: string; name: string; level: number | null; phase: number | null }[] | null
}
export async function gameOverviewAPI(
  account: GameAccount,
  signal?: AbortSignal,
): Promise<GameOverview> {
  return getData<GameOverview>(
    'game/hypergryph/account/overview',
    { appCode: account.appCode, uid: account.uid, gameId: account.gameId },
    { timeout: ACCOUNT_REQUEST_TIMEOUT, signal },
  )
}
