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
const { endfieldPlainText } = await vite.ssrLoadModule('/src/common/endfieldText.ts')
test('game emphasis tokens retain content and line breaks without interpreting HTML', () => {
  assert.equal(endfieldPlainText('- First\n<@ba.info>- No items.</>'), '- First\n- No items.')
  assert.equal(
    endfieldPlainText('x < 3\n<img onerror="alert(1)">'),
    'x < 3\n<img onerror="alert(1)">',
  )
  assert.equal(endfieldPlainText(null), '')
})
