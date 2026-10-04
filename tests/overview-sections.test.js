import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
})
after(() => vite.close())
const { overviewSections } = await vite.ssrLoadModule('/src/common/overviewSections.ts')
const item = (id, current) => ({
  id,
  name: id,
  current,
  total: null,
  level: null,
  completeAt: null,
  status: 'unknown',
})
test('joins rogue counts by ID rather than position and preserves zero and missing measures', () => {
  const sections = [
    { key: 'arknightsActivities', items: [] },
    {
      key: 'arknightsRogueRelics',
      items: [item('new', 0), item('old', 25), item('relics-only', 3)],
    },
    {
      key: 'arknightsRogueBank',
      items: [
        item('old', 40),
        item('new', 11),
        { ...item('bank-only', 0), artworkUrl: 'https://bbs.hycdn.cn/fixture.png' },
      ],
    },
    { key: 'arknightsSandbox', items: [] },
  ]
  const before = structuredClone(sections),
    output = overviewSections(sections)
  assert.deepEqual(
    output.map((s) => s.key),
    ['arknightsActivities', 'arknightsRogue', 'arknightsSandbox'],
  )
  assert.deepEqual(
    output[1].items.map((i) => [i.id, ...i.measures.map((m) => m.current)]),
    [
      ['new', 0, 11],
      ['old', 25, 40],
      ['relics-only', 3, null],
      ['bank-only', null, 0],
    ],
  )
  assert.equal(output[1].items[3].artworkUrl, sections[2].items[2].artworkUrl)
  assert.deepEqual(sections, before)
})
test('keeps an empty group and handles either measure being entirely absent', () => {
  assert.deepEqual(overviewSections(), [])
  assert.deepEqual(overviewSections([{ key: 'arknightsRogueBank', items: [] }]), [
    { key: 'arknightsRogue', items: [] },
  ])
  const bank = overviewSections([{ key: 'arknightsRogueBank', items: [item('only', 0)] }])[0]
  assert.deepEqual(
    bank.items[0].measures.map((m) => m.current),
    [null, 0],
  )
})

test('orders verified boss rush editions newest first without mutating cached source', () => {
  const source = [
    {
      key: 'arknightsBossRush',
      items: ['01', '02', null, '10', '06', 'unknown'].map((edition, index) => ({
        ...item(String(index), null),
        bossRush: { edition },
      })),
    },
  ]
  const before = structuredClone(source)
  assert.deepEqual(
    overviewSections(source)[0].items.map((i) => i.bossRush.edition),
    ['10', '06', '02', '01', null, 'unknown'],
  )
  assert.deepEqual(source, before)
})
