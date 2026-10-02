// Run explicitly during resource maintenance; never from build or a browser request.
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const sources = JSON.parse(
  await readFile(new URL('../src/assets/game-avatars/sources.json', import.meta.url), 'utf8'),
)
async function response(url) {
  const result = await fetch(url, { signal: AbortSignal.timeout(30000) })
  if (!result.ok) throw new Error(`Resource fetch failed: ${result.status} ${url}`)
  return result
}
const raw = (repo, revision, path) =>
  `https://raw.githubusercontent.com/${repo}/${revision}/${path}`
const ark = sources.arknights,
  end = sources.endfield
const characters = await (await response(raw(ark.repository, ark.revision, ark.path))).json()
const tree = await (
  await response(
    `https://api.github.com/repos/${end.repository}/git/trees/${end.revision}?recursive=1`,
  )
).json()
if (tree.truncated || !Array.isArray(tree.tree))
  throw new Error('Incomplete Endfield resource tree')
const catalog = { arknights: {}, endfield: {}, endfieldVariants: {} }
for (const id of Object.keys(characters).sort()) {
  if (
    !/^char_\d+_[a-z0-9]+$/.test(id) ||
    (characters[id].isNotObtainable && !ark.additionalCharacterIds?.includes(id))
  )
    continue
  catalog.arknights[id] =
    `https://web.hycdn.cn/arknights/game/assets/char_skin/portrait/${encodeURIComponent(ark.defaultSkins?.[id] ?? `${id}#1`)}.png`
}
const icons = tree.tree
  .filter(
    (entry) =>
      entry.path.startsWith(end.path) && /\/icon_chr_\d{4}_[a-z0-9]+\.png$/.test(entry.path),
  )
  .sort((a, b) => a.path.localeCompare(b.path))
if (Object.keys(catalog.arknights).length < 400 || icons.length < 25)
  throw new Error('Unexpectedly incomplete avatar catalog')
const directory = new URL('../src/assets/game-avatars/endfield/', import.meta.url)
await mkdir(directory, { recursive: true })
for (const entry of icons) {
  const id = entry.path
    .split('/')
    .at(-1)
    .replace(/^icon_/, '')
    .replace(/\.png$/, '')
  const file = new URL(`${id}.png`, directory)
  let bytes
  try {
    bytes = await readFile(file)
  } catch {
    /* New resource. */
  }
  const matches = (data) =>
    data &&
    createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex') === entry.sha
  if (!matches(bytes))
    bytes = Buffer.from(
      await (await response(raw(end.repository, end.revision, entry.path))).arrayBuffer(),
    )
  if (!matches(bytes) || !bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')))
    throw new Error(`Invalid image: ${id}`)
  await writeFile(file, bytes)
  catalog.endfield[id] = `${id}.png`
  // Skland card IDs are MD5 hashes of the public game character IDs.
  catalog.endfield[createHash('md5').update(id).digest('hex')] = `${id}.png`
}
for (const [id, variants] of Object.entries(end.variants ?? {})) {
  const files = Object.fromEntries(
    Object.entries(variants).map(([gender, charId]) => {
      if (!catalog.endfield[charId]) throw new Error(`Missing appearance resource: ${charId}`)
      return [gender, catalog.endfield[charId]]
    }),
  )
  catalog.endfieldVariants[id] = files
  catalog.endfieldVariants[createHash('md5').update(id).digest('hex')] = files
}
await writeFile(
  new URL('../src/assets/game-avatars/catalog.json', import.meta.url),
  JSON.stringify(catalog, null, 2) + '\n',
)
console.log(
  `Cached ${Object.keys(catalog.arknights).length} Arknights links and ${icons.length} Endfield images.`,
)
