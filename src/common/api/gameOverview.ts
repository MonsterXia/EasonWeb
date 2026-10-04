import { getData, ACCOUNT_REQUEST_TIMEOUT } from './client'
import type { GameAccount } from './accounts'
import { rememberOverview } from '../resourceRecovery'
import { parseGameOverview } from './validation'

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
    /** Arknights: exact empty string means all completed; null means unavailable. */
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
      skinId?: string | null
      artworkUrl?: string | null
      sandbox?: SandboxRecord
      bossRush?: BossRushRecord
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
        avatarUrl?: string | null
        skinId?: string | null
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
  const data = parseGameOverview(
    await getData<unknown>(
      'game/hypergryph/account/overview',
      { appCode: account.appCode, uid: account.uid, gameId: account.gameId },
      { timeout: ACCOUNT_REQUEST_TIMEOUT, signal },
    ),
    account,
  )
  rememberOverview(data)
  return data
}

export interface SandboxRecord {
  maxDay: number | null
  maxDayChallenge: number | null
  mainQuest: number | null
  subQuests: { id: string; name: string | null; done: boolean | null }[] | null
  baseLv: number | null
  unlockNode: number | null
  /** Successful defenses, not individual enemies killed. */
  enemyKill: number | null
  createRift: number | null
  fixRift: { current: number | null; total: number | null }
}
export interface BossRushRecord {
  edition: string | null
  played: boolean | null
  difficulty: 'NORMAL' | 'TEAM' | 'EX' | 'SP' | null
  stageCode: string | null
}
