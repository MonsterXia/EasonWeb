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
const { overviewSections, endfieldSections } = await vite.ssrLoadModule(
  '/src/common/overviewSections.ts',
)
const item = (id, current) => ({
  id,
  name: id,
  current,
  total: null,
  level: null,
  completeAt: null,
  status: 'unknown',
})
test('merges the legacy Endfield base level without duplicating rooms or changing cached data', () => {
  const data = {
    metrics: [{ key: 'cnsLevel', group: 'base', current: 4, total: 5 }],
    sections: [
      {
        key: 'endfieldSpaceship',
        items: [
          { ...item('control', 0), nameKey: 'endfieldControl', level: 0, staff: [] },
          item('plant', null),
        ],
      },
    ],
  }
  const before = structuredClone(data)
  const rooms = endfieldSections(data)[0].items
  assert.equal(rooms.length, 2)
  assert.equal(rooms[0].level, 0)
  assert.equal(rooms[0].maxLevel, 5)
  assert.deepEqual(rooms[0].staff, [])
  assert.deepEqual(data, before)
  data.sections[0].items[0].level = null
  assert.equal(endfieldSections(data)[0].items[0].level, 4)
})
test('preserves Endfield base data when room details are missing, empty or partial', () => {
  const metric = { key: 'cnsLevel', group: 'base', current: 0, total: 5 }
  for (const sections of [
    undefined,
    [],
    [{ key: 'endfieldSpaceship', items: [] }],
    [{ key: 'endfieldSpaceship', items: [item('plant', null)] }],
  ]) {
    const result = endfieldSections({ metrics: [metric], sections })
    assert.equal(result.length, 1)
    assert.equal(result[0].key, 'endfieldSpaceship')
    assert.equal(result[0].items[0].level, 0)
    assert.equal(result[0].items[0].current, null)
    assert.equal(result[0].items[0].staff, undefined)
  }
  assert.deepEqual(endfieldSections({ metrics: [] }), [])
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

test('Endfield exploration joins six counts by region ID and keeps domains, partial values and order', () => {
  const source = [
    { key: 'endfieldSpaceship', items: [] },
    {
      key: 'endfieldExplorationPuzzles',
      items: [
        { ...item('d1:same', 0), name: 'Same name', subtitle: 'Domain 1', total: 12 },
        { ...item('d2:same', 3), name: 'Same name', subtitle: 'Domain 2', total: 9 },
      ],
    },
    {
      key: 'endfieldExplorationChests',
      items: [
        { ...item('d2:same', 8), total: 10 },
        { ...item('d1:same', 0), total: 0 },
        item('only-chests', 2),
      ],
    },
    { key: 'endfieldWarEchoes', items: [] },
  ]
  const original = structuredClone(source)
  const result = overviewSections(source)
  assert.deepEqual(
    result.map((s) => s.key),
    ['endfieldSpaceship', 'endfieldExploration', 'endfieldWarEchoes'],
  )
  assert.deepEqual(
    result[1].items.map((r) => r.id),
    ['d1:same', 'd2:same', 'only-chests'],
  )
  assert.deepEqual(
    result[1].items[0].measures.map((m) => [m.current, m.total]),
    [
      [0, 0],
      [0, 12],
      [null, null],
      [null, null],
      [null, null],
      [null, null],
    ],
  )
  assert.equal(result[1].items[1].measures[0].current, 8)
  assert.equal(result[1].items[1].subtitle, 'Domain 2')
  assert.equal(result[1].items[2].measures[1].current, null)
  assert.deepEqual(source, original)
  assert.deepEqual(overviewSections([{ key: 'endfieldExplorationChests', items: [] }]), [
    { key: 'endfieldExploration', items: [] },
  ])
})

test('Endfield regions follow official newest-level and legacy priority before limiting the display', () => {
  const ids = [
    'domain_1:map01_lv001',
    'domain_1:map01_lv009',
    'domain_2:map02_lv001',
    'domain_2:map02_lv008',
    'domain_2:map02_lv009',
    'domain_2:indie_dg016',
  ]
  const result = overviewSections([
    { key: 'endfieldExplorationChests', items: ids.map((id) => item(id, 0)) },
  ])
  assert.deepEqual(
    result[0].items.map((row) => row.id),
    [ids[5], ids[1], ids[4], ids[3], ids[2], ids[0]],
  )
})
