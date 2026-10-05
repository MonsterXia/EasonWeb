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
const { request } = await vite.ssrLoadModule('/src/common/gatewayManager/axiosClient.ts')
const api = await vite.ssrLoadModule('/src/common/api/accounts.ts')
const { gameOverviewAPI } = await vite.ssrLoadModule('/src/common/api/gameOverview.ts')
const { getCurrentUserAPI } = await vite.ssrLoadModule('/src/common/api/user.ts')
const role = { appCode: 'arknights', gameId: '1', uid: 'fixture', nickName: 'Fixture' }
const profile = {
  id: 1,
  username: 'Fixture',
  email: null,
  phone: null,
  isAdmin: false,
  createdAt: '',
  updatedAt: '',
  hypergryphAccount: null,
  postAdmin: null,
}
const overview = {
  account: role,
  fetchedAt: 1000,
  updatedAt: null,
  profile: { level: 0, worldLevel: null, registeredAt: null, lastOnlineAt: 0, mainProgress: '' },
  metrics: [{ key: 'stamina', group: 'daily', current: 0, total: 135 }],
  operators: null,
}
function respond(data, envelope = true, status = 200) {
  request.defaults.adapter = async (config) => ({
    data: envelope ? { data } : data,
    status,
    statusText: 'OK',
    headers: {},
    config,
  })
}
const invalid = (error) => error.name === 'ApiResponseError'

test('malformed successful envelopes are rejected, without exposing payload contents', async () => {
  const { getData } = await vite.ssrLoadModule('/src/common/api/client.ts')
  for (const data of [null, 'private-payload', [], {}, { message: 'private-payload' }]) {
    respond(data, false)
    await assert.rejects(
      getData('/test'),
      (error) => invalid(error) && !error.message.includes('private-payload'),
    )
  }
  for (const value of [false, 0, null, []]) {
    respond(value)
    assert.deepEqual(await getData('/test'), value)
  }
})

test('Glory Road validates display slots, nullable acquisition facts and legacy compatibility', async () => {
  const { gloryFixture } = await import('./fixtures/glory-road.js')
  const gloryRoad = gloryFixture()
  respond({ ...overview, gloryRoad })
  assert.deepEqual((await gameOverviewAPI(role)).gloryRoad, gloryRoad)
  for (const patch of [
    { count: '106' },
    { display: [{ slot: 0, medalId: 'invalid' }] },
    { medals: [{ ...gloryRoad.medals[0], plated: 'true' }] },
    { medals: [{ ...gloryRoad.medals[0], acquiredAt: 1e30 }] },
  ]) {
    respond({ ...overview, gloryRoad: { ...gloryRoad, ...patch } })
    await assert.rejects(gameOverviewAPI(role), invalid)
  }
  respond(overview)
  assert.equal((await gameOverviewAPI(role)).gloryRoad, undefined)
})

test('current user rejects malformed rendered fields and binding identity', async () => {
  respond(profile)
  assert.deepEqual(await getCurrentUserAPI(), profile)
  for (const patch of [
    { username: null },
    { isAdmin: 'true' },
    { email: {} },
    { hypergryphAccount: { phone: 123 } },
  ]) {
    respond({ ...profile, ...patch })
    await assert.rejects(getCurrentUserAPI(), invalid)
  }
})

test('game accounts and username availability validate their concrete shape', async () => {
  for (const value of [null, false, {}, [{ ...role, uid: 12 }], [{ ...role, serverName: {} }]]) {
    respond(value)
    await assert.rejects(api.gameAccountsAPI(), invalid)
  }
  respond([role])
  assert.deepEqual(await api.gameAccountsAPI(), [role])
  respond('false')
  await assert.rejects(api.usernameExistsAPI('Fixture'), invalid)
})

test('overview accepts zero/null/empty story, rejects invalid nested fields and mismatched roles', async () => {
  respond(overview)
  assert.deepEqual(await gameOverviewAPI(role), overview)
  const malformed = [
    { metrics: null },
    { profile: null },
    { fetchedAt: 1e30 },
    { account: { ...role, uid: 'different-role' } },
    { metrics: [{ ...overview.metrics[0], current: '0' }] },
    { metrics: [{ ...overview.metrics[0], recovery: { value: 0, at: 1000, intervalSeconds: 0 } }] },
    { sections: [{ key: 'base', items: null }] },
    { operators: [{ id: 'a', name: {}, level: 0, phase: null }] },
  ]
  for (const patch of malformed) {
    respond({ ...overview, ...patch })
    await assert.rejects(gameOverviewAPI(role), invalid)
  }
})

test('Endfield room contracts retain assignments and accept older responses without staff', async () => {
  const account = { ...role, appCode: 'endfield' }
  const room = {
    id: 'control',
    name: null,
    nameKey: 'endfieldControl',
    level: 0,
    current: 1,
    total: 3,
    status: 'unknown',
    completeAt: null,
  }
  const data = (patch) => ({
    ...overview,
    account,
    sections: [{ key: 'endfieldSpaceship', items: [{ ...room, ...patch }] }],
  })
  for (const patch of [
    {},
    { staff: null },
    { staff: [] },
    {
      maxLevel: 5,
      staff: [
        { id: 'a', name: 'Alpha', avatarUrl: 'https://bbs.hycdn.cn/fixture.png' },
        { id: 'unknown', name: null },
      ],
    },
  ]) {
    const payload = data(patch)
    respond(payload)
    assert.deepEqual(await gameOverviewAPI(account), payload)
  }
  for (const patch of [
    { staff: {} },
    { staff: [null] },
    { staff: [{ id: 'a', name: 1 }] },
    { staff: [{ id: 'a', name: null, avatarUrl: {} }] },
    { maxLevel: '5' },
  ]) {
    respond(data(patch))
    await assert.rejects(gameOverviewAPI(account), invalid)
  }
})

test('check-in retains HTTP 207 partial success and rejects malformed result arrays', async () => {
  const partial = {
    checkInResults: ['Synthetic success'],
    errorResults: [{ ...role, error: 'Synthetic failure' }],
  }
  respond(partial, true, 207)
  assert.deepEqual(await api.checkInAPI(), partial)
  for (const value of [
    null,
    { checkInResults: [], errorResults: null },
    { checkInResults: [{}], errorResults: [] },
  ]) {
    respond(value)
    await assert.rejects(api.checkInAPI(), invalid)
  }
})

test('failure categories distinguish auth, upstream, network and invalid data', async () => {
  const { apiFailureKind, ApiResponseError } = await vite.ssrLoadModule('/src/common/api/errors.ts')
  for (const [status, kind] of [
    [401, 'session'],
    [403, 'authorization'],
    [429, 'rateLimit'],
    [502, 'upstream'],
    [503, 'unavailable'],
  ]) {
    assert.equal(apiFailureKind({ isAxiosError: true, response: { status } }), kind)
  }
  assert.equal(apiFailureKind({ isAxiosError: true, code: 'ECONNABORTED' }), 'network')
  assert.equal(apiFailureKind(new ApiResponseError()), 'invalidResponse')
})

test('War Echoes accepts complete nested records and rejects malformed teams', async () => {
  const { warEchoesFixture } = await import('./fixtures/war-echoes.js')
  const warEchoes = warEchoesFixture()
  respond({ ...overview, warEchoes })
  assert.equal(
    (await gameOverviewAPI(role)).warEchoes.seasons[0].weeks[0].stages[0].difficulties[0].record
      .durationSeconds,
    125,
  )
  warEchoes.seasons[0].weeks[0].stages[0].difficulties[0].record.team[0].level = 'bad'
  respond({ ...overview, warEchoes })
  await assert.rejects(gameOverviewAPI(role), invalid)
})

test('regional development and monolith validate nested records without losing zero or unknown', async () => {
  const { developmentFixture, monolithFixture } = await import('./fixtures/endfield-development.js')
  const data = {
    ...overview,
    regionalDevelopment: developmentFixture(),
    monolith: monolithFixture(),
  }
  respond(data)
  assert.deepEqual(await gameOverviewAPI(role), data)
  for (const mutate of [
    (x) => (x.regionalDevelopment.regions[0].settlements[0].unlocked = 'true'),
    (x) => (x.regionalDevelopment.regions[0].settlements[0].experience = {}),
    (x) => (x.monolith.themes[0].medal.plated = 1),
    (x) => (x.monolith.themes[1].stages[0].hard.record.team[0].level = '90'),
  ]) {
    const invalidData = structuredClone(data)
    mutate(invalidData)
    respond(invalidData)
    await assert.rejects(gameOverviewAPI(role), invalid)
  }
})
