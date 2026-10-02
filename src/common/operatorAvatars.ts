import catalog from '../assets/game-avatars/catalog.json'
// Vite fingerprints local images so Pages/CDN and browser caches can reuse them safely.
const localImages = import.meta.glob<string>('../assets/game-avatars/endfield/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})
export function operatorAvatar(appCode: string, id: string): string | undefined {
  if (appCode === 'arknights' && Object.prototype.hasOwnProperty.call(catalog.arknights, id))
    return (catalog.arknights as Record<string, string>)[id]
  if (appCode === 'endfield' && Object.prototype.hasOwnProperty.call(catalog.endfield, id)) {
    const file = (catalog.endfield as Record<string, string>)[id]
    return localImages[`../assets/game-avatars/endfield/${file}`]
  }
  return undefined
}
