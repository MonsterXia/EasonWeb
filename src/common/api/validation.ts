import { ApiResponseError } from './errors'
import type { CurrentUser } from './user'
import type { CheckInResults, GameAccount } from './accounts'
import type { GameOverview } from './gameOverview'

type Check = (value: unknown) => boolean
const string: Check = (value) => typeof value === 'string'
const number: Check = (value) => typeof value === 'number' && Number.isFinite(value)
const boolean: Check = (value) => typeof value === 'boolean'
const timestamp: Check = (value) => number(value) && Math.abs(value as number) <= 8.64e12
const nullable =
  (check: Check): Check =>
  (value) =>
    value === null || check(value)
const optional =
  (check: Check): Check =>
  (value) =>
    value === undefined || check(value)
const array =
  (check: Check): Check =>
  (value) =>
    Array.isArray(value) && value.every(check)
const oneOf =
  (...choices: unknown[]): Check =>
  (value) =>
    choices.includes(value)
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const shape =
  (fields: Record<string, Check>): Check =>
  (value) =>
    record(value) && Object.entries(fields).every(([key, check]) => check(value[key]))

function parse<T>(value: unknown, check: Check): T {
  if (!check(value)) throw new ApiResponseError()
  return value as T
}

// Metadata is not consumed by the UI. Require the data slot without coercing false, zero or null.
export function responseData<T>(value: unknown): T {
  if (!record(value) || !Object.prototype.hasOwnProperty.call(value, 'data'))
    throw new ApiResponseError()
  return value.data as T
}

const timestamps = { createdAt: string, updatedAt: string }
const gameAccount = shape({
  appCode: string,
  nickName: string,
  uid: string,
  gameId: string,
  serverName: optional(string),
})
const currentUser = shape({
  id: (value) => Number.isSafeInteger(value),
  username: string,
  email: nullable(string),
  phone: nullable(string),
  isAdmin: boolean,
  ...timestamps,
  hypergryphAccount: nullable(shape({ phone: string, userId: number, ...timestamps })),
  postAdmin: nullable(
    shape({
      id: number,
      email: string,
      organization: string,
      role: string,
      userId: nullable(number),
      ...timestamps,
    }),
  ),
})
const metric = shape({
  key: string,
  group: oneOf('daily', 'base', 'collection'),
  current: nullable(number),
  total: nullable(number),
  recoveryAt: optional(nullable(timestamp)),
  recovery: optional(
    shape({
      value: (value) => number(value) && (value as number) >= 0,
      at: timestamp,
      intervalSeconds: (value) => number(value) && (value as number) > 0,
    }),
  ),
})
const sectionItem = shape({
  id: string,
  name: nullable(string),
  nameKey: optional(string),
  operatorId: optional(string),
  skinId: optional(nullable(string)),
  artworkUrl: optional(nullable(string)),
  sandbox: optional(
    shape({
      maxDay: nullable(number),
      maxDayChallenge: nullable(number),
      mainQuest: nullable(number),
      subQuests: nullable(
        array(shape({ id: string, name: nullable(string), done: nullable(boolean) })),
      ),
      baseLv: nullable(number),
      unlockNode: nullable(number),
      enemyKill: nullable(number),
      createRift: nullable(number),
      fixRift: shape({ current: nullable(number), total: nullable(number) }),
    }),
  ),
  bossRush: optional(
    shape({
      edition: nullable(string),
      played: nullable(boolean),
      difficulty: oneOf(null, 'NORMAL', 'TEAM', 'EX', 'SP'),
      stageCode: nullable(string),
    }),
  ),
  level: nullable(number),
  maxLevel: optional(number),
  staff: optional(
    nullable(
      array(
        shape({
          id: string,
          name: nullable(string),
          avatarUrl: optional(nullable(string)),
        }),
      ),
    ),
  ),
  status: oneOf('idle', 'working', 'complete', 'locked', 'unknown'),
  current: nullable(number),
  total: nullable(number),
  completeAt: nullable(timestamp),
  subtitle: optional(nullable(string)),
  rating: optional(nullable(string)),
})
const warMember = shape({
  id: string,
  name: nullable(string),
  avatarUrl: nullable(string),
  level: nullable(number),
  potential: nullable(number),
  phase: nullable(number),
  rarity: nullable(string),
  element: nullable(string),
})

const warEnemy = shape({
  id: string,
  name: nullable(string),
  level: nullable(number),
  description: nullable(string),
  ability: nullable(string),
  artworkUrl: nullable(string),
})

const warRecord = shape({
  recordedAt: nullable(number),
  durationSeconds: nullable(number),
  team: nullable(array(warMember)),
})

const warDifficulty = shape({
  id: string,
  difficulty: oneOf('normal', 'hard', 'cruel'),
  name: nullable(string),
  isPassed: nullable(boolean),
  firstPassAt: nullable(number),
  plusTask: nullable(boolean),
  description: nullable(string),
  feature: nullable(string),
  target: nullable(string),
  recommendLevel: nullable(number),
  enemies: nullable(array(warEnemy)),
  record: nullable(warRecord),
})

const warStage = shape({
  id: string,
  name: nullable(string),
  stars: nullable(number),
  plusTask: nullable(boolean),
  difficulties: nullable(array(warDifficulty)),
})

const warWeek = shape({
  id: string,
  name: nullable(string),
  startAt: nullable(number),
  endAt: nullable(number),
  stars: nullable(number),
  rating: nullable(string),
  stages: nullable(array(warStage)),
})

const warSeason = shape({
  id: string,
  name: nullable(string),
  artworkUrl: nullable(string),
  startAt: nullable(number),
  endAt: nullable(number),
  stars: nullable(number),
  rating: nullable(string),
  weeks: nullable(array(warWeek)),
})

const warHonor = shape({
  acquired: nullable(boolean),
  name: nullable(string),
  stars: nullable(number),
  acquiredAt: nullable(number),
})

const warEchoes = shape({
  detailAvailable: boolean,
  seasons: array(warSeason),
  honors: nullable(array(warHonor)),
})

const developmentOfficer = shape({
  id: nullable(string),
  name: nullable(string),
  avatarUrl: nullable(string),
})
const settlement = shape({
  id: string,
  name: nullable(string),
  level: nullable(number),
  unlocked: nullable(boolean),
  experience: nullable(number),
  experienceMax: nullable(number),
  isMaxLevel: nullable(boolean),
  money: nullable(number),
  moneyMax: nullable(number),
  officer: nullable(developmentOfficer),
})
const developmentRegion = shape({
  id: string,
  name: nullable(string),
  level: nullable(number),
  money: nullable(number),
  moneyMax: nullable(number),
  settlements: nullable(array(settlement)),
})
const regionalDevelopment = shape({ regions: array(developmentRegion) })
const monolithMedal = shape({
  name: nullable(string),
  acquired: nullable(boolean),
  plated: nullable(boolean),
  level: nullable(number),
  artworkUrl: nullable(string),
  acquiredAt: nullable(number),
})
const monolithStage = shape({
  id: string,
  name: nullable(string),
  normal: nullable(warDifficulty),
  hard: nullable(warDifficulty),
})
const monolithTheme = shape({
  id: string,
  name: nullable(string),
  artworkUrl: nullable(string),
  activityName: nullable(string),
  isInActivity: nullable(boolean),
  startAt: nullable(number),
  endAt: nullable(number),
  medal: nullable(monolithMedal),
  stages: nullable(array(monolithStage)),
})
const gloryMedal = shape({
  id: string,
  name: nullable(string),
  category: nullable(string),
  level: nullable(number),
  plated: nullable(boolean),
  canCertify: nullable(boolean),
  acquiredAt: nullable(timestamp),
  artworkUrl: nullable(string),
})
const gloryRoad = shape({
  count: nullable(number),
  tiers: array(shape({ level: number, count: nullable(number) })),
  display: nullable(
    array(shape({ slot: oneOf(1, 2, 3, 4, 5, 6, 7, 8, 9, 10), medalId: nullable(string) })),
  ),
  medals: nullable(array(gloryMedal)),
})
const monolith = shape({
  detailAvailable: boolean,
  currentThemeId: nullable(string),
  themes: array(monolithTheme),
})

const gameOverview = shape({
  gloryRoad: optional(gloryRoad),
  regionalDevelopment: optional(regionalDevelopment),
  monolith: optional(monolith),
  warEchoes: optional(warEchoes),
  account: gameAccount,
  fetchedAt: timestamp,
  calculatedAt: optional(timestamp),
  updatedAt: nullable(timestamp),
  profile: shape({
    level: nullable(number),
    worldLevel: nullable(number),
    registeredAt: nullable(timestamp),
    lastOnlineAt: nullable(timestamp),
    mainProgress: nullable(string),
    endministratorGender: optional(oneOf(null, 'male', 'female')),
  }),
  metrics: array(metric),
  sections: optional(array(shape({ key: string, items: array(sectionItem) }))),
  operators: nullable(
    array(
      shape({
        id: string,
        name: string,
        level: nullable(number),
        phase: nullable(number),
        avatarUrl: optional(nullable(string)),
        skinId: optional(nullable(string)),
        rarity: optional(nullable(number)),
        potential: optional(nullable(number)),
        profession: optional(nullable(string)),
        element: optional(nullable(string)),
      }),
    ),
  ),
})

export const parseCurrentUser = (value: unknown) => parse<CurrentUser>(value, currentUser)
export const parseGameAccounts = (value: unknown) => parse<GameAccount[]>(value, array(gameAccount))
export const parseAvailability = (value: unknown) => parse<boolean>(value, boolean)
export const parseCheckIn = (value: unknown) =>
  parse<CheckInResults>(
    value,
    shape({
      checkInResults: array(string),
      errorResults: array((item) => gameAccount(item) && record(item) && string(item.error)),
      requestId: optional(string),
      completedAt: optional(timestamp),
      durationMs: optional(number),
      summary: optional(shape({total: number, success: number, alreadyCheckedIn: number, failed: number})),
      results: optional(array(shape({
        account: gameAccount,
        status: oneOf('success', 'already_checked_in', 'failed'),
        rewards: array(shape({id: nullable(string), name: nullable(string), count: nullable((v) => number(v) && (v as number) >= 0), type: nullable(string)})),
        rewardsComplete: boolean,
        errorCode: nullable(oneOf('clock_skew', 'timeout', 'network_error', 'auth_expired', 'rate_limited', 'upstream_error', 'invalid_response', 'unsupported_game')),
        retryable: boolean,
        upstreamCode: nullable(number),
      }))),
    }),
  )
export function parseGameOverview(value: unknown, account: GameAccount): GameOverview {
  const result = parse<GameOverview>(value, gameOverview)
  if (
    result.account.appCode !== account.appCode ||
    result.account.gameId !== account.gameId ||
    result.account.uid !== account.uid
  )
    throw new ApiResponseError()
  return result
}
