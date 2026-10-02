import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, cacheDir: 'node_modules/.vite-tests', server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } })
after(() => vite.close())
const { request } = await vite.ssrLoadModule('/src/common/gatewayManager/axiosClient.ts')
const { default: Gateway } = await vite.ssrLoadModule('/src/common/gatewayManager/gatewayManager.ts')
const { basicCheckAPI } = await vite.ssrLoadModule('/src/common/api/basic.ts')

test('gateway includes cookie credentials and a bounded request timeout', async () => {
  let sent
  request.defaults.adapter = async config => {
    sent = config
    return { data: { message: 'Common Server API is running.' }, status: 200, statusText: 'OK', headers: {}, config }
  }
  assert.deepEqual(await basicCheckAPI(), { message: 'Common Server API is running.' })
  assert.equal(sent.url, '/api/')
  assert.equal(sent.withCredentials, true)
  assert.ok(sent.timeout > 0 && sent.timeout <= 30000)
})

test('gateway preserves envelope and HTTP errors', async () => {
  const envelope = { message: 'ok', data: false, httpStatus: 200 }
  request.defaults.adapter = async config => ({ data: envelope, status: 200, statusText: 'OK', headers: {}, config })
  const gateway = Gateway.getInstance()
  assert.equal(await gateway.get(gateway.buildStandardURL('/user/username/missing/exist')), envelope)
  const unauthorized = { response: { status: 401 } }
  request.defaults.adapter = async () => { throw unauthorized }
  await assert.rejects(gateway.get('/api/user/current'), error => error === unauthorized)
})

test('user API unwraps profiles and distinguishes expired sessions from outages', async () => {
  const { getCurrentUserAPI, logoutAPI } = await vite.ssrLoadModule('/src/common/api/user.ts')
  const profile = { id: 12, username: 'alice', email: null, hypergryphAccount: null, postAdmin: null }
  request.defaults.adapter = async config => ({ data: { message: 'ok', data: profile, httpStatus: 200 }, status: 200, statusText: 'OK', headers: {}, config })
  assert.deepEqual(await getCurrentUserAPI(), profile)
  for (const status of [401, 404]) {
    request.defaults.adapter = async () => { throw { isAxiosError: true, response: { status } } }
    assert.equal(await getCurrentUserAPI(), null)
  }
  request.defaults.adapter = async () => { throw { isAxiosError: true, response: { status: 503 } } }
  await assert.rejects(getCurrentUserAPI())
  await assert.rejects(logoutAPI())
  request.defaults.adapter = async config => ({ data: { data: false }, status: 200, statusText: 'OK', headers: {}, config })
  await assert.rejects(getCurrentUserAPI(), /Invalid current user response/)
})

test('account operations use correct HTTP methods and never use query-string credentials', async () => {
  const api = await vite.ssrLoadModule('/src/common/api/accounts.ts')
  const calls = []
  request.defaults.adapter = async config => {
    calls.push(config)
    return { data: { data: config.method === 'get' ? false : null }, status: 200, statusText: 'OK', headers: {}, config }
  }
  await api.loginAPI('alice', 'Secret1!')
  await api.registerAPI({ username: 'alice', email: 'a@example.com', password: 'Secret1!', registrationCode: '123456' })
  await api.registrationCodeAPI('a@example.com')
  await api.resetCodeAPI('alice', 'a@example.com')
  await api.resetPasswordAPI({ username: 'alice', email: 'a@example.com', password: 'Secret1!', code: '123456' })
  await api.postLoginAPI('post@example.com', 'Secret1!')
  await api.bindPostAPI()
  await api.unbindPostAPI()
  await api.hypergryphSmsAPI('13800000000')
  await api.bindHypergryphAPI({ method: 'sms', phone: '13800000000', code: '123456' })
  await api.unbindHypergryphAPI()
  await api.gameAccountsAPI()
  await api.checkInAPI()
  assert.equal(await api.usernameExistsAPI('alice'), false)
  assert.deepEqual(calls.map(c=>[c.method,c.url]), [
    ['post','/api/user/login'],['post','/api/user/register'],['post','/api/user/email/verify'],
    ['post','/api/user/password/reset/code'],['post','/api/user/password/reset'],
    ['post','/api/post/admin/login'],['post','/api/post/admin/binding'],['delete','/api/post/admin/binding'],
    ['post','/api/game/hypergryph/account/sms'],['post','/api/game/hypergryph/account'],['delete','/api/game/hypergryph/account'],
    ['get','/api/game/hypergryph/account/games'],['post','/api/game/hypergryph/account/check-in'],['get','/api/user/username/alice/exist'],
  ])
  assert.ok(calls.every(c=>c.withCredentials && !c.params))
  assert.deepEqual(JSON.parse(calls[2].data), {email:'a@example.com',type:'register'})
  assert.deepEqual(JSON.parse(calls[9].data), {method:'sms',phone:'13800000000',code:'123456'})
  assert.equal(api.passwordError('Secret1!'), '')
  assert.notEqual(api.passwordError('Ab!'+ '中'.repeat(24)), '')
})

test('game overview reads a selected role with cookie auth and forwards cancellation and failures', async () => {
  const { gameOverviewAPI } = await vite.ssrLoadModule('/src/common/api/gameOverview.ts')
  let sent
  const overview = { account: { appCode: 'endfield', uid: '42', gameId: '99' }, metrics: [] }
  request.defaults.adapter = async config => {
    sent = config
    return { data: { data: overview }, status: 200, statusText: 'OK', headers: {}, config }
  }
  const controller = new AbortController()
  assert.deepEqual(await gameOverviewAPI({ ...overview.account, nickName: 'Private name' }, controller.signal), overview)
  assert.equal(sent.method, 'get')
  assert.equal(sent.url, '/api/game/hypergryph/account/overview')
  assert.deepEqual(sent.params, overview.account)
  assert.equal(sent.withCredentials, true)
  assert.equal(sent.signal, controller.signal)
  assert.equal(sent.timeout, 60000)
  request.defaults.adapter = async () => { throw { isAxiosError: true, response: { status: 502 } } }
  await assert.rejects(gameOverviewAPI(overview.account))
})
