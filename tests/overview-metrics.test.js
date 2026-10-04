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
const { overviewMetrics } = await vite.ssrLoadModule('/src/common/overviewMetrics.ts')
const metric = (key, current = 0) => ({ key, group: 'base', current, total: null })
const board = (current) => ({
  key: 'arknightsClues',
  items: [
    { id: 'own', current: 9, total: 10 },
    { id: 'board', current, total: 7 },
  ],
})

test('base summary follows official order and reuses the clue board, not inventory', () => {
  const data = {
    metrics: [
      metric('drones'),
      metric('tradingOrders'),
      metric('tiredOperators'),
      metric('manufacturing'),
      metric('restedOperators'),
    ],
    sections: [board(0)],
  }
  const snapshot = structuredClone(data)
  const result = overviewMetrics('arknights', data)
  assert.deepEqual(
    result.map((m) => m.key),
    [
      'drones',
      'restedOperators',
      'tradingOrders',
      'manufacturing',
      'tiredOperators',
      'clueCollection',
    ],
  )
  assert.deepEqual(result.at(-1), { key: 'clueCollection', group: 'base', current: 0, total: 7 })
  assert.deepEqual(data, snapshot)
})

test('missing clues stay unknown and an upstream metric is not duplicated or replaced', () => {
  assert.deepEqual(
    overviewMetrics('arknights', { metrics: [metric('drones')] }).at(-1),
    metric('clueCollection', null),
  )
  assert.equal(
    overviewMetrics('arknights', { metrics: [metric('drones')], sections: [board(null)] }).at(-1)
      .current,
    null,
  )
  const supplied = { ...metric('clueCollection', 5), total: 7 }
  const result = overviewMetrics('arknights', {
    metrics: [supplied, metric('drones')],
    sections: [board(0)],
  })
  assert.equal(result.filter((m) => m.key === 'clueCollection').length, 1)
  assert.deepEqual(result.at(-1), supplied)
})

test('other groups, unknown metrics and Endfield retain their data', () => {
  const data = {
    metrics: [metric('custom'), { ...metric('stamina'), group: 'daily' }, metric('drones')],
    sections: [board(2)],
  }
  assert.deepEqual(overviewMetrics('endfield', data), data.metrics)
  const result = overviewMetrics('arknights', data)
  assert.deepEqual(result[1], data.metrics[1])
  assert.deepEqual(result.at(-1), metric('custom'))
  assert.deepEqual(overviewMetrics('arknights', { metrics: [] }), [])
})
