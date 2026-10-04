import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer as createHttpServer } from 'node:http'
import { once } from 'node:events'
import { createServer, loadConfigFromFile } from 'vite'

test('development backend switch, proxy origin guard and cookie lifecycle', async () => {
  const previous = process.env.DEV_API_BACKEND
  let vite
  let upstream
  try {
    const config = async (backend, command = 'serve', isPreview = false) => {
      process.env.DEV_API_BACKEND = backend
      return (await loadConfigFromFile({ command, mode: 'development', isPreview })).config
    }
    const proxyOf = (value) => Object.values(value.server.proxy)[0]
    const local = await config('local')
    assert.equal(proxyOf(local).target, 'http://localhost:8787')
    assert.equal(proxyOf(local).configure, undefined)
    assert.equal(proxyOf(local).headers, undefined)
    for (const value of [
      await config('production', 'build'),
      await config('production', 'serve', true),
    ]) {
      assert.equal(proxyOf(value).configure, undefined)
      assert.equal(
        value.plugins.some((plugin) => plugin?.name === 'local-production-api-guard'),
        false,
      )
    }
    const remote = await config('production')
    const proxy = proxyOf(remote)
    assert.equal(proxy.target, 'https://api.246801357.xyz')
    let requests = 0
    upstream = createHttpServer((req, res) => {
      requests++
      assert.equal(req.headers.origin, 'https://eason.246801357.xyz')
      assert.equal(req.headers.referer, 'https://eason.246801357.xyz/')
      const logout = req.url === '/user/logout'
      res.setHeader(
        'Set-Cookie',
        `auth_token=${logout ? '' : 'synthetic-session'}; Domain=api.246801357.xyz; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${logout ? 0 : 3600}`,
      )
      res.end(
        JSON.stringify({
          path: req.url,
          cookieReceived: req.headers.cookie === 'auth_token=synthetic-session',
        }),
      )
    })
    upstream.listen(0, '127.0.0.1')
    await once(upstream, 'listening')
    // Exercise the real proxy against a synthetic upstream, never a real login.
    proxy.target = `http://127.0.0.1:${upstream.address().port}`
    vite = await createServer({
      ...remote,
      configFile: false,
      server: { ...remote.server, port: 0, watch: null },
    })
    await vite.listen()
    const origin = `http://127.0.0.1:${vite.httpServer.address().port}`
    const response = await fetch(`${origin}/api/user/current?test=1`, {
      headers: { origin, cookie: 'auth_token=synthetic-session' },
    })
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { path: '/user/current?test=1', cookieReceived: true })
    const cookie = response.headers.get('set-cookie')
    assert.doesNotMatch(cookie, /;\s*(Secure|Domain=)/i)
    assert.match(cookie, /HttpOnly/)
    assert.match(cookie, /SameSite=Lax/)
    const logout = await fetch(`${origin}/api/user/logout`, { method: 'POST', headers: { origin } })
    assert.match(logout.headers.get('set-cookie'), /Max-Age=0/)
    for (const headers of [
      { origin: 'https://unrelated.example' },
      { origin, 'sec-fetch-site': 'cross-site' },
      { origin: 'null' },
    ]) {
      const blocked = await fetch(`${origin}/api/user/current`, { headers })
      assert.equal(blocked.status, 403)
    }
    assert.equal(requests, 2)
  } finally {
    await vite?.close()
    if (upstream) await new Promise((resolve) => upstream.close(resolve))
    if (previous === undefined) delete process.env.DEV_API_BACKEND
    else process.env.DEV_API_BACKEND = previous
  }
})
