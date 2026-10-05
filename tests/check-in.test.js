import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
const vite = await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]}})
after(()=>vite.close())
const { parseCheckIn } = await vite.ssrLoadModule('/src/common/api/validation.ts')
const role = {appCode:'endfield',uid:'r',gameId:'s',nickName:'Fixture'}
const row = {account:role,status:'success',rewards:[{id:'a',name:null,count:null,type:'0'}],rewardsComplete:false,errorCode:null,retryable:false,upstreamCode:null}
const report = {checkInResults:[],errorResults:[],results:[row]}
test('accepts unknown reward details but rejects malformed structured check-in responses',()=>{
 assert.deepEqual(parseCheckIn(report),report)
 for (const patch of [{status:'invented'},{rewards:[{name:'reward',count:-1}]},{retryable:'yes'},{errorCode:'unknown'}]) {
  assert.throws(()=>parseCheckIn({...report,results:[{...row,...patch}]}),{name:'ApiResponseError'})
 }
 assert.deepEqual(parseCheckIn({checkInResults:[],errorResults:[]}),{checkInResults:[],errorResults:[]})
})
