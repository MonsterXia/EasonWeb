const member = { id: 'crew-a', name: 'Record operator', avatarUrl: 'https://web.hycdn.cn/test-war-crew.png', level: 35, potential: 0, phase: 2, rarity: '6', element: 'Heat' }
const challenge = (difficulty) => ({
  id: difficulty, difficulty, name: 'A complete challenge name', isPassed: difficulty === 'normal', firstPassAt: difficulty === 'normal' ? 1790700000 : null, plusTask: false,
  description: 'A long description that stays readable and wraps on mobile.', feature: 'Stage feature', target: 'Additional target', recommendLevel: 60,
  enemies: [{ id: 'enemy', name: 'Enemy', level: 60, description: 'Enemy description', ability: 'Enemy ability', artworkUrl: null }],
  record: difficulty === 'normal' ? { recordedAt: 1790700125, durationSeconds: 125, team: [member, { ...member, id: 'b', name: 'Second operator', avatarUrl: null }, { ...member, id: 'c' }, { ...member, id: 'd' }] } : null,
})
const week = (id, name, startAt, endAt) => ({ id, name, startAt, endAt, stars: 7, rating: 'A', stages: Array.from({ length: 3 }, (_, i) => ({ id: `${id}-${i}`, name: `Stage ${i + 1}`, stars: i + 1, plusTask: false, difficulties: ['normal', 'hard', 'cruel'].map(challenge) })) })
export const warEchoesFixture = () => ({ detailAvailable: true, seasons: [
  { id:'current', name:'Current season', artworkUrl:'https://web.hycdn.cn/test-war-cover.png', startAt:1790000000,endAt:1792000000,stars:9,rating:'S+',weeks:[week('first','Rotation I',1790000000,1790599999),week('second','Rotation II',1790600000,1792000000)] },
  { id:'old',name:'Historical season',artworkUrl:null,startAt:1780000000,endAt:1782000000,stars:0,rating:null,weeks:[{...week('past','Past rotation',1780000000,1782000000),stages:[]}] },
],honors:[{name:'Gold honor',stars:3,acquired:true,acquiredAt:1790700000},{name:'Secret honor',stars:2,acquired:false,acquiredAt:null}] })
