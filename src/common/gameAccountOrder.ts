import type { GameAccount } from './api/accounts'

/** Keep upstream role order within each game without mutating cached responses. */
export function sortGameAccounts(accounts: readonly GameAccount[]): GameAccount[] {
  const priority = (game: GameAccount) =>
    game.appCode === 'arknights' ? 0 : game.appCode === 'endfield' ? 1 : 2
  return [...accounts].sort((a, b) => priority(a) - priority(b))
}
