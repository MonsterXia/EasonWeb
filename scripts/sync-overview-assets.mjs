import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = new URL('../src/assets/skland/', import.meta.url)
const sources = JSON.parse(await readFile(new URL('sources.json', root), 'utf8'))
const hash = (data) => createHash('sha256').update(data).digest('hex')
const modules = new Map()
const download = (url) => {
  const parsed = new URL(url)
  if (
    parsed.protocol !== 'https:' ||
    !['bbs.hycdn.cn', 'web.hycdn.cn', 'assets.skland.com', 'media.prts.wiki'].includes(
      parsed.hostname,
    )
  )
    throw new Error('Unexpected asset host')
  return execFileSync(
    'curl',
    ['--fail', '--silent', '--show-error', '--location', '--retry', '2', url],
    { maxBuffer: 16 * 1024 * 1024 },
  )
}
const crc32 = (data) => {
  let crc = 0xffffffff
  for (const byte of data) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}
// Official AK UI uses these indexed PNGs as faint watermarks. Lift only palette
// alpha for small standalone icons, preserving RGB, silhouette and antialiasing.
export function normalizeAlpha(input) {
  const output = Buffer.from(input)
  if (output[25] !== 3) throw new Error('Expected indexed PNG')
  for (let offset = 8; offset < output.length; ) {
    const length = output.readUInt32BE(offset)
    if (output.toString('ascii', offset + 4, offset + 8) === 'tRNS') {
      const alpha = output.subarray(offset + 8, offset + 8 + length)
      const max = Math.max(...alpha)
      if (!max) throw new Error('Empty alpha palette')
      for (let i = 0; i < alpha.length; i++) alpha[i] = Math.round((alpha[i] * 230) / max)
      output.writeUInt32BE(
        crc32(output.subarray(offset + 4, offset + 8 + length)),
        offset + 8 + length,
      )
      return output
    }
    offset += length + 12
  }
  throw new Error('Missing PNG transparency palette')
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sync = process.argv.includes('--sync')
  for (const [key, source] of Object.entries(sources)) {
    if (!/^[\w-]+\.png$/.test(source.file)) throw new Error(`Invalid filename: ${key}`)
    const path = new URL(source.file, root)
    let data
    if (sync) {
      if (source.url) data = download(source.url)
      else {
        if (!modules.has(source.module)) modules.set(source.module, download(source.module))
        const bytes = modules.get(source.module)
        if (hash(bytes) !== source.moduleSha256) throw new Error(`Module changed: ${key}`)
        const token = source.variable ?? source.property
        if (!/^[\w$]+$/.test(token)) throw new Error(`Invalid selector: ${key}`)
        const pattern = new RegExp(
          '(?<![\\w$])' +
            token.replace(/\$/g, '\\$') +
            (source.variable ? '=' : ':') +
            '`(data:image/png;base64,[A-Za-z0-9+/=]+)`',
        )
        const match = bytes.toString('utf8').match(pattern)
        if (!match) throw new Error(`Asset missing: ${key}`)
        data = Buffer.from(match[1].split(',')[1], 'base64')
      }
      if (hash(data) !== (source.sourceSha256 ?? source.sha256))
        throw new Error(`Source changed: ${key}`)
      if (source.transform === 'palette-alpha-230') data = normalizeAlpha(data)
    } else data = await readFile(path)
    if (hash(data) !== source.sha256) throw new Error(`Checksum mismatch: ${key}`)
    if (!data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
      throw new Error(`Invalid PNG: ${key}`)
    if (sync) await writeFile(path, data)
  }
  console.log(
    `${sync ? 'Synced' : 'Verified'} ${Object.keys(sources).length} local overview assets`,
  )
}
