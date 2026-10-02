import type { GameAccount } from './api/accounts'

type Translate = (key: string, values?: Record<string, string>) => string

export function gameServerName(
  game: Pick<GameAccount, 'appCode' | 'gameId' | 'serverName'>,
  t: Translate,
): string {
  const name = game.serverName?.trim()
  if (name) {
    if (name === '官服') return t('game.servers.official')
    if (/^(B服|Bilibili服|哔哩哔哩服)$/i.test(name)) return t('game.servers.bilibili')
    return name
  }
  // Verified Arknights channel only. Endfield gameId is a role serverId, not a channel ID.
  if (game.appCode === 'arknights' && String(game.gameId) === '1') return t('game.servers.official')
  return t('game.servers.unknown', { id: String(game.gameId) })
}
