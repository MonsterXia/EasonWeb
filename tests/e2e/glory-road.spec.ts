import { test, expect, reply, user, role, overview } from './fixtures'
import { readFileSync } from 'node:fs'
// @ts-expect-error Shared synthetic fixtures.
import { gloryFixture } from '../fixtures/glory-road.js'
for (const theme of ['light','dark']) for (const language of ['zh-CN','en']) {
  test(`Glory Road ${theme} ${language}`, async ({page,isMobile}) => {
    await page.addInitScript(({theme,language}) => {localStorage.setItem('eason-theme',theme);localStorage.setItem('eason-locale',language)}, {theme,language})
    const account={...role('first'),appCode:'endfield',gameId:'2'}
    const second={...account,uid:'second',nickName:'second'}
    const data={...overview(),account,gloryRoad:gloryFixture(),metrics:[...overview().metrics,{key:'achievements',group:'collection',current:106,total:null},{key:'cnsLevel',group:'base',current:3,total:3}]}
    await page.route('**/api/user/current',r=>reply(r,user))
    await page.route('**/api/game/hypergryph/account/games',r=>reply(r,[account,second]))
    await page.route('**/api/game/hypergryph/account/overview?*',r=>reply(r,{...data,account:r.request().url().includes('uid=second')?second:account}))
    await page.route('https://web.hycdn.cn/synthetic-medal.png',r=>r.fulfill({contentType:'image/png',body:readFileSync('src/assets/skland/ef-medalLevel3.png')}))
    await page.route('https://web.hycdn.cn/synthetic-missing.png',r=>r.abort())
    await page.goto('/game/hypergryph/skland')
    const road=page.locator('[data-section="endfieldGloryRoad"]')
    await expect(road).toBeVisible()
    await expect(road.locator('.collection-total')).toHaveText('106')
    await expect(road.locator('.tier-counts dd')).toHaveText(['20','40','46'])
    expect(await road.evaluate(el=>el.compareDocumentPosition(document.querySelector('[data-section="endfieldSpaceship"]')!) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy()
    await expect(road.locator('.display-medal')).toHaveCount(10)
    await expect(road.locator('.display-medal').first()).toHaveAttribute('title',/Medal 9$/)
    await expect(road.locator('.wall-row').first().locator('.display-medal').nth(1)).toHaveAttribute('data-slot','3')
    await expect(road.locator('.glory-details')).toHaveAttribute('inert')
    await road.locator('.reveal-button').focus()
    await page.keyboard.press('Enter')
    await expect(road.locator('.medal-card')).toHaveCount(12)
    await expect(road.locator('.medal-card').first()).toHaveAttribute('data-medal-id','medal-11')
    await expect(road.locator('.medal-card').first().locator('.medal-image > .overview-artwork:not(.certification-mark) img')).toHaveAttribute('src',/ef-medalLevel3/)
    await road.locator('.glory-toolbar .el-select__wrapper').click()
    await page.getByRole('option',{name:language==='en'?'Highest tier first':'等级由高到低',exact:true}).click()
    await expect(road.locator('.medal-card').nth(1)).toHaveAttribute('data-medal-id','medal-8')
    await road.locator('.filter-button').click()
    await road.locator('.glory-filters .el-select__wrapper').first().click()
    await page.getByRole('option',{name:language==='en'?'Tier I':'一级奖章',exact:true}).click()
    await expect(road.locator('.medal-card')).toHaveCount(4)
    await road.locator('.glory-filters .el-select__wrapper').nth(2).click()
    await page.getByRole('option',{name:language==='en'?'Eligible':'可认证',exact:true}).click()
    await expect(road.locator('.medal-card')).toHaveCount(0)
    await expect(road).toContainText(language==='en'?'No medals match':'没有符合筛选条件')
    await road.locator('.reset-button').click()
    await expect(road.locator('.medal-card')).toHaveCount(12)
    for(const width of isMobile?[390,320]:[1280]) {
      await page.setViewportSize({width,height:1000})
      await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
      await expect.poll(()=>road.locator('.medal-card').last().evaluate(el=>{
        const reveal=el.closest('.glory-details')!.parentElement!
        return el.getBoundingClientRect().bottom<=reveal.getBoundingClientRect().bottom+1
      })).toBe(true)
      await road.screenshot({path:`/tmp/glory-${theme}-${language}-${width}.png`})
    }
    await road.locator('.reveal-button').click()
    await expect(road.locator('.glory-details')).toHaveAttribute('inert')
    await road.locator('.reveal-button').click()
    await expect(road.locator('.glory-toolbar')).toContainText(language==='en'?'Highest tier first':'等级由高到低')
    await page.getByRole('button').filter({hasText:'second'}).click()
    await expect(road.locator('.reveal-button')).toHaveAttribute('aria-expanded','false')
  })
}
test('Glory Road distinguishes empty, unavailable and legacy totals',async({page})=>{
  const account={...role(),appCode:'endfield',gameId:'2'}
  await page.route('**/api/user/current',r=>reply(r,user))
  await page.route('**/api/game/hypergryph/account/games',r=>reply(r,[account]))
  let extra:Record<string,unknown>={gloryRoad:{count:0,tiers:[1,2,3].map(level=>({level,count:0})),display:[],medals:[]}}
  await page.route('**/api/game/hypergryph/account/overview?*',r=>reply(r,{...overview(),account,...extra}))
  await page.goto('/game/hypergryph/skland')
  const road=page.locator('[data-section="endfieldGloryRoad"]')
  await expect(road.locator('.collection-total')).toHaveText('0')
  await road.locator('.reveal-button').click()
  await expect(road).toContainText('暂无已获得奖章')
  extra={metrics:[{key:'achievements',group:'collection',current:7,total:null}]}
  await page.reload()
  await expect(road.locator('.collection-total')).toHaveText('7')
  await expect(road).toContainText('展示奖章暂不可用')
  await road.locator('.reveal-button').click()
  await expect(road).toContainText('奖章详情暂不可用')
})
