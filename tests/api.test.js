import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({
  configFile: false,
  cacheDir: 'node_modules/.vite-tests',
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
})
after(() => vite.close())
const { request } = await vite.ssrLoadModule('/src/common/gatewayManager/axiosClient.ts')
const { default: Gateway } = await vite.ssrLoadModule(
  '/src/common/gatewayManager/gatewayManager.ts',
)
const { basicCheckAPI } = await vite.ssrLoadModule('/src/common/api/basic.ts')

test('game accounts prioritize Arknights, preserve within-game order and never mutate cached lists', async () => {
  const { sortGameAccounts } = await vite.ssrLoadModule('/src/common/gameAccountOrder.ts')
  const accounts = [
    { appCode: 'endfield', uid: 'ef1' },
    { appCode: 'other', uid: 'other' },
    { appCode: 'arknights', uid: 'ak2' },
    { appCode: 'arknights', uid: 'ak1' },
    { appCode: 'endfield', uid: 'ef2' },
  ]
  const original = structuredClone(accounts)
  assert.deepEqual(
    sortGameAccounts(accounts).map((role) => role.uid),
    ['ak2', 'ak1', 'ef1', 'ef2', 'other'],
  )
  assert.deepEqual(accounts, original)
  assert.deepEqual(sortGameAccounts([]), [])
})

test('gateway includes cookie credentials and a bounded request timeout', async () => {
  let sent
  request.defaults.adapter = async (config) => {
    sent = config
    return {
      data: { message: 'Common Server API is running.' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }
  assert.deepEqual(await basicCheckAPI(), { message: 'Common Server API is running.' })
  assert.equal(sent.url, '/api/')
  assert.equal(sent.withCredentials, true)
  assert.ok(sent.timeout > 0 && sent.timeout <= 30000)
})

test('gateway preserves envelope and HTTP errors', async () => {
  const envelope = { message: 'ok', data: false, httpStatus: 200 }
  request.defaults.adapter = async (config) => ({
    data: envelope,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  })
  const gateway = Gateway.getInstance()
  assert.equal(
    await gateway.get(gateway.buildStandardURL('/user/username/missing/exist')),
    envelope,
  )
  const unauthorized = { response: { status: 401 } }
  request.defaults.adapter = async () => {
    throw unauthorized
  }
  await assert.rejects(gateway.get('/api/user/current'), (error) => error === unauthorized)
})

test('user API unwraps profiles and distinguishes expired sessions from outages', async () => {
  const { getCurrentUserAPI, logoutAPI } = await vite.ssrLoadModule('/src/common/api/user.ts')
  const profile = {
    id: 12,
    username: 'alice',
    email: null,
    phone: null,
    isAdmin: false,
    createdAt: '',
    updatedAt: '',
    hypergryphAccount: null,
    postAdmin: null,
  }
  request.defaults.adapter = async (config) => ({
    data: { message: 'ok', data: profile, httpStatus: 200 },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  })
  assert.deepEqual(await getCurrentUserAPI(), profile)
  for (const status of [401, 404]) {
    request.defaults.adapter = async () => {
      throw { isAxiosError: true, response: { status } }
    }
    assert.equal(await getCurrentUserAPI(), null)
  }
  request.defaults.adapter = async () => {
    throw { isAxiosError: true, response: { status: 503 } }
  }
  await assert.rejects(getCurrentUserAPI())
  await assert.rejects(logoutAPI())
  request.defaults.adapter = async (config) => ({
    data: { data: false },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  })
  await assert.rejects(getCurrentUserAPI(), /Invalid API response/)
})

test('account operations use correct HTTP methods and never use query-string credentials', async () => {
  const api = await vite.ssrLoadModule('/src/common/api/accounts.ts')
  const calls = []
  request.defaults.adapter = async (config) => {
    calls.push(config)
    return {
      data: {
        data: config.url.endsWith('/games')
          ? []
          : config.url.endsWith('/check-in')
            ? { checkInResults: [], errorResults: [] }
            : config.method === 'get'
              ? false
              : null,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }
  await api.loginAPI('alice', 'Secret1!')
  await api.registerAPI({
    username: 'alice',
    email: 'a@example.com',
    password: 'Secret1!',
    registrationCode: '123456',
  })
  await api.registrationCodeAPI('a@example.com')
  await api.resetCodeAPI('alice', 'a@example.com')
  await api.resetPasswordAPI({
    username: 'alice',
    email: 'a@example.com',
    password: 'Secret1!',
    code: '123456',
  })
  await api.postLoginAPI('post@example.com', 'Secret1!')
  await api.bindPostAPI()
  await api.unbindPostAPI()
  await api.hypergryphSmsAPI('13800000000')
  await api.bindHypergryphAPI({ method: 'sms', phone: '13800000000', code: '123456' })
  await api.unbindHypergryphAPI()
  await api.gameAccountsAPI()
  await api.checkInAPI()
  assert.equal(await api.usernameExistsAPI('alice'), false)
  assert.deepEqual(
    calls.map((c) => [c.method, c.url]),
    [
      ['post', '/api/user/login'],
      ['post', '/api/user/register'],
      ['post', '/api/user/email/verify'],
      ['post', '/api/user/password/reset/code'],
      ['post', '/api/user/password/reset'],
      ['post', '/api/post/admin/login'],
      ['post', '/api/post/admin/binding'],
      ['delete', '/api/post/admin/binding'],
      ['post', '/api/game/hypergryph/account/sms'],
      ['post', '/api/game/hypergryph/account'],
      ['delete', '/api/game/hypergryph/account'],
      ['get', '/api/game/hypergryph/account/games'],
      ['post', '/api/game/hypergryph/account/check-in'],
      ['get', '/api/user/username/alice/exist'],
    ],
  )
  assert.ok(calls.every((c) => c.withCredentials && !c.params))
  assert.deepEqual(JSON.parse(calls[2].data), { email: 'a@example.com', type: 'register' })
  assert.deepEqual(JSON.parse(calls[9].data), {
    method: 'sms',
    phone: '13800000000',
    code: '123456',
  })
  assert.equal(api.passwordError('Secret1!'), '')
  assert.notEqual(api.passwordError('Ab!' + '中'.repeat(24)), '')
})

test('game overview reads a selected role with cookie auth and forwards cancellation and failures', async () => {
  const { gameOverviewAPI } = await vite.ssrLoadModule('/src/common/api/gameOverview.ts')
  let sent
  const overview = {
    account: { appCode: 'endfield', uid: '42', gameId: '99', nickName: 'Fixture' },
    fetchedAt: 1000,
    updatedAt: null,
    profile: {
      level: null,
      worldLevel: null,
      registeredAt: null,
      lastOnlineAt: null,
      mainProgress: null,
    },
    metrics: [],
    operators: null,
  }
  request.defaults.adapter = async (config) => {
    sent = config
    return { data: { data: overview }, status: 200, statusText: 'OK', headers: {}, config }
  }
  const controller = new AbortController()
  assert.deepEqual(
    await gameOverviewAPI({ ...overview.account, nickName: 'Private name' }, controller.signal),
    overview,
  )
  assert.equal(sent.method, 'get')
  assert.equal(sent.url, '/api/game/hypergryph/account/overview')
  assert.deepEqual(sent.params, { appCode: 'endfield', uid: '42', gameId: '99' })
  assert.equal(sent.withCredentials, true)
  assert.equal(sent.signal, controller.signal)
  assert.equal(sent.timeout, 60000)
  request.defaults.adapter = async () => {
    throw { isAxiosError: true, response: { status: 502 } }
  }
  await assert.rejects(gameOverviewAPI(overview.account))
})

test('shared API client preserves empty values, explicit request options, and HTTP failures', async () => {
  const { getData, postData } = await vite.ssrLoadModule('/src/common/api/client.ts')
  const controller = new AbortController()
  const calls = []
  request.defaults.adapter = async (config) => {
    calls.push(config)
    return {
      data: {
        data: config.url.endsWith('/games')
          ? []
          : config.url.endsWith('/check-in')
            ? { checkInResults: [], errorResults: [] }
            : config.method === 'get'
              ? false
              : null,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }
  assert.equal(
    await getData('/test', { query: 'a b' }, { signal: controller.signal, timeout: 60000 }),
    false,
  )
  assert.equal(await postData('test', { name: 'Alice' }), null)
  assert.equal(calls[0].url, '/api/test')
  assert.deepEqual(calls[0].params, { query: 'a b' })
  assert.equal(calls[0].signal, controller.signal)
  assert.equal(calls[0].timeout, 60000)
  assert.equal(calls[1].timeout, 10000)
  assert.ok(calls.every((call) => call.withCredentials))
  const failure = { isAxiosError: true, response: { status: 503 } }
  request.defaults.adapter = async () => {
    throw failure
  }
  await assert.rejects(getData('test'), (error) => error === failure)
  await assert.rejects(postData('test'), (error) => error === failure)
  controller.abort()
  const count = calls.length
  await assert.rejects(
    getData('test', undefined, { signal: controller.signal }),
    (error) => error.code === 'ERR_CANCELED',
  )
  assert.equal(calls.length, count)
})

test('auth operations forward cancellation to every request in the form flow', async () => {
  const api = await vite.ssrLoadModule('/src/common/api/accounts.ts')
  const controller = new AbortController()
  const calls = []
  request.defaults.adapter = async (config) => {
    calls.push(config)
    return {
      data: { data: config.method === 'get' ? false : null },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }
  await api.loginAPI('fixture', 'Synthetic1!', controller.signal)
  await api.registerAPI(
    {
      username: 'fixture',
      email: 'test@example.invalid',
      password: 'Synthetic1!',
      registrationCode: '123456',
    },
    controller.signal,
  )
  await api.registrationCodeAPI('test@example.invalid', controller.signal)
  await api.resetCodeAPI('fixture', 'test@example.invalid', controller.signal)
  await api.resetPasswordAPI(
    { username: 'fixture', email: 'test@example.invalid', password: 'Synthetic1!', code: '123456' },
    controller.signal,
  )
  await api.usernameExistsAPI('fixture', controller.signal)
  assert.equal(calls.length, 6)
  assert.ok(calls.every((config) => config.signal === controller.signal))
})

test('identity and binding changes invalidate Skland cache only after successful operations', async () => {
  const { sklandCache } = await vite.ssrLoadModule('/src/common/sklandCache.ts')
  const api = await vite.ssrLoadModule('/src/common/api/accounts.ts')
  const { logoutAPI, getCurrentUserAPI } = await vite.ssrLoadModule('/src/common/api/user.ts')
  const game = { appCode: 'arknights', gameId: '1', uid: 'fixture', nickName: 'Doctor' }
  const profile = { id: 1, hypergryphAccount: { phone: 'fixture', updatedAt: 'v1' } }
  const seed = async () => {
    sklandCache.setUser(profile)
    await sklandCache.loadOverview(game, async () => ({ account: game }))
  }
  const changes = [
    () => api.loginAPI('fixture', 'password'),
    () =>
      api.registerAPI({
        username: 'fixture',
        email: 'user@example.com',
        password: 'password',
        registrationCode: '000000',
      }),
    () =>
      api.resetPasswordAPI({
        username: 'fixture',
        email: 'user@example.com',
        password: 'password',
        code: '000000',
      }),
    () => api.bindHypergryphAPI({ phone: 'fixture', method: 'sms', code: '000000' }),
    () => api.unbindHypergryphAPI(),
    () => logoutAPI(),
  ]
  for (const change of changes) {
    await seed()
    request.defaults.adapter = async () => {
      throw { isAxiosError: true, response: { status: 503 } }
    }
    await assert.rejects(change())
    assert.ok(sklandCache.peekOverview(game))
    request.defaults.adapter = async (config) => ({
      data: { data: null },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    })
    await change()
    assert.equal(sklandCache.peekOverview(game), undefined)
  }
  await seed()
  request.defaults.adapter = async () => {
    throw { isAxiosError: true, response: { status: 401 } }
  }
  assert.equal(await getCurrentUserAPI(), null)
  assert.equal(sklandCache.peekOverview(game), undefined)
})
