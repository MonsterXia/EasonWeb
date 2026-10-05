// Synthetic collection; IDs, dates and names are not a player snapshot.
export function gloryFixture() {
  return {
    count: 106,
    tiers: [{level:1,count:20},{level:2,count:40},{level:3,count:46}],
    display: Array.from({length:10}, (_,i) => ({slot:i+1,medalId:`medal-${9-i}`})),
    medals: Array.from({length:12}, (_,i) => ({
      id:`medal-${i}`, name:`奖章 ${i} · Synthetic Medal ${i}`, category:'synthetic', level:i%3+1,
      plated:i%2===0, canCertify:true, acquiredAt:1700000000+i*86400,
      artworkUrl:i===11?'https://web.hycdn.cn/synthetic-missing.png':'https://web.hycdn.cn/synthetic-medal.png',
    })),
  }
}
