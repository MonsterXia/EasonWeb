import catalog from '../assets/game-avatars/catalog.json'
// Vite fingerprints local images so Pages/CDN and browser caches can reuse them safely.
const localImages = import.meta.glob<string>('../assets/game-avatars/endfield/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})
export function operatorAvatar(
  appCode: string,
  id: string,
  gender?: 'male' | 'female' | null,
): string | undefined {
  if (appCode === 'arknights' && Object.prototype.hasOwnProperty.call(catalog.arknights, id))
    return (catalog.arknights as Record<string, string>)[id]
  if (appCode === 'endfield' && Object.prototype.hasOwnProperty.call(catalog.endfield, id)) {
    const file = (catalog.endfield as Record<string, string>)[id]
    return localImages[`../assets/game-avatars/endfield/${file}`]
  }
  if (
    appCode === 'endfield' &&
    (gender === 'male' || gender === 'female') &&
    Object.prototype.hasOwnProperty.call(catalog.endfieldVariants, id)
  ) {
    const variants = (catalog.endfieldVariants as Record<string, { male: string; female: string }>)[
      id
    ]
    return localImages[`../assets/game-avatars/endfield/${variants![gender]}`]
  }
  return undefined
}
