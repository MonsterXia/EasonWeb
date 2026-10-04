import { officialArtworkUrl } from './officialArtwork'

// Official Skland SDK: CHAR/avatar; class-change Amiya uses CHAR_SKIN/avatar #2.
// New character IDs need no catalogue update.
export function operatorAvatar(
  appCode: string,
  id: string,
  avatarUrl?: string | null,
): string | undefined {
  if (appCode === 'endfield') return officialArtworkUrl(avatarUrl)
  if (appCode !== 'arknights' || !/^char_\d+_[a-z0-9_]+$/.test(id)) return undefined
  const base = 'https://web.hycdn.cn/arknights/game/assets/'
  return /^char_\d+_amiya\d$/.test(id)
    ? `${base}char_skin/avatar/${encodeURIComponent(`${id}#2`)}.png`
    : `${base}char/avatar/${encodeURIComponent(id)}.png`
}
