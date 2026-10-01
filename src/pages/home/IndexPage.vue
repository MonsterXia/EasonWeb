<script setup lang="ts">
import { ref } from 'vue'
import OrbitScene from '@/components/OrbitScene.vue'
import { basicCheckAPI } from '@/common/api/basic'

const checking = ref(false)
const status = ref<'idle' | 'success' | 'error'>('idle')
const message = ref('')
async function checkHealth() {
  if (checking.value) return
  checking.value = true
  status.value = 'idle'
  try {
    const response = await basicCheckAPI()
    if (typeof response.message !== 'string' || !response.message)
      throw new Error('Invalid health response')
    message.value = response.message
    status.value = 'success'
  } catch {
    message.value = '无法连接服务，请稍后重试。'
    status.value = 'error'
  } finally {
    checking.value = false
  }
}
</script>

<template>
  <div class="home-page">
    <section class="hero">
      <div class="hero-watermark" aria-hidden="true">PLAY</div>
      <span class="hero-corner corner-one" aria-hidden="true" /><span
        class="hero-corner corner-two"
        aria-hidden="true"
      />
      <div class="hero-copy">
        <div class="hero-kicker">
          <span class="eyebrow">WELCOME TO MY ORBIT</span
          ><span class="edition">PERSONAL SPACE / 01</span>
        </div>
        <h1>
          让热爱，<br /><span class="gradient-text"
            >自由生长<span class="title-star" aria-hidden="true">✳</span></span
          >
        </h1>
        <p class="hero-description">
          这里是 Eason 的数字游乐场。<br />收集灵感，探索游戏，用小工具解锁更多可能。
        </p>
        <div class="hero-actions">
          <router-link class="primary-link" to="/game/hypergryph/endfield"
            >探索游戏工具 <span>↗</span></router-link
          ><router-link class="secondary-link" to="/user">进入我的空间 <span>→</span></router-link>
        </div>
        <div class="hero-bottom">
          <span class="tiny-stars">✦ ✦ ✦</span><span>一点好奇心，和无限的可能。</span><i />
        </div>
      </div>
      <div class="hero-visual">
        <span class="visual-index" aria-hidden="true">∞<span>IDEAS IN ORBIT</span></span
        ><OrbitScene class="hero-art" /><span class="visual-sticker" aria-hidden="true"
          >保持好奇 <span>↗</span></span
        >
      </div>
    </section>
    <div class="ticker" aria-hidden="true">
      <span>TOOLS FOR YOUR NEXT ADVENTURE</span><b>✦</b><span>灵感不设限</span><b>✦</b
      ><span>LESS GRIND, MORE PLAY</span><b>✦</b><span>探索 · 创造 · 热爱</span><b>✦</b>
    </div>
    <section class="tools-section" aria-labelledby="tools-title">
      <div class="tools-heading">
        <div>
          <p class="section-label">THE TOOLBOX / 精选工具</p>
          <h2 id="tools-title">下一站，玩点什么<span>？</span></h2>
        </div>
        <span class="tools-count">03 个入口 <span>↙</span></span>
      </div>
      <div class="tool-grid">
        <router-link to="/game/hypergryph/endfield" class="tool-card tool-endfield"
          ><span class="card-index" aria-hidden="true">01</span>
          <div class="card-top">
            <span class="tool-icon"
              ><el-icon><Aim /></el-icon></span
            ><span class="pill">无需登录</span>
          </div>
          <div class="tool-art industrial-art" aria-hidden="true">
            <i /><i /><i /><span>EF</span>
          </div>
          <div class="tool-info">
            <p class="section-label">01 / ARKNIGHTS: ENDFIELD</p>
            <h3>终末地 · 基质计算器</h3>
            <p>选好武器，找到合适的刷取地图。<br />让每一次探索，都更有方向。</p>
            <span class="tool-cta">开始计算 <span>↗</span></span>
          </div></router-link
        >
        <router-link to="/game/hypergryph/skland" class="tool-card tool-skland"
          ><span class="card-index" aria-hidden="true">02</span>
          <div class="card-top">
            <span class="tool-icon"
              ><el-icon><Calendar /></el-icon></span
            ><span class="pill">每日打卡</span>
          </div>
          <div class="tool-art calendar-art" aria-hidden="true">
            <div><span>DAILY QUEST</span><strong>✓</strong><i>＋ EXP</i></div>
            <b>✧</b>
          </div>
          <div class="tool-info">
            <p class="section-label">02 / SKLAND CHECK-IN</p>
            <h3>森空岛 · 每日签到</h3>
            <p>明日方舟与终末地，奖励不落下。<br />关联角色，一处轻松签到。</p>
            <span class="tool-cta">前往签到 <span>↗</span></span>
          </div></router-link
        >
        <router-link to="/user" class="tool-card tool-account"
          ><span class="card-index" aria-hidden="true">03</span>
          <div class="card-top">
            <span class="tool-icon"
              ><el-icon><User /></el-icon></span
            ><span class="pill">专属空间</span>
          </div>
          <div class="tool-art account-art" aria-hidden="true">
            <div class="id-card">
              <span>EASON / ID</span>
              <div>◉<i /><i /></div>
              <b>•••• ••••</b>
            </div>
            <span class="id-spark">✦</span>
          </div>
          <div class="tool-info">
            <p class="section-label">03 / YOUR PERSONAL SPACE</p>
            <h3>用户中心 · 我的账号</h3>
            <p>管理个人资料与关联账号。<br />把你的游戏日常，安放在这里。</p>
            <span class="tool-cta">打开我的空间 <span>↗</span></span>
          </div></router-link
        >
      </div>
    </section>
    <section class="health-panel" aria-label="服务状态">
      <div class="health-caption">
        <span class="health-icon"
          ><el-icon><Connection /></el-icon
        ></span>
        <div>
          <h3>一切就绪，随时出发。</h3>
          <p>遇到连接问题？在这里检查服务状态。</p>
        </div>
      </div>
      <el-button :loading="checking" @click="checkHealth"
        ><el-icon><RefreshRight /></el-icon><span>检查服务状态</span></el-button
      ><el-alert
        v-if="status !== 'idle'"
        :type="status === 'success' ? 'success' : 'error'"
        :title="message"
        :closable="false"
        show-icon
        class="health-status"
        role="status"
      />
    </section>
  </div>
</template>
<style scoped>
.hero {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  align-items: center;
  gap: 45px;
  padding: 8px 0 44px;
}
.hero-kicker {
  display: flex;
  gap: 22px;
  align-items: center;
}
.edition {
  font:
    8px ui-monospace,
    monospace;
  color: #7d89a5;
  letter-spacing: 0.06em;
}
.hero h1 {
  font-size: clamp(48px, 5.4vw, 76px);
  font-weight: 850;
  line-height: 1.2;
  letter-spacing: -0.07em;
  margin: 26px 0 24px;
}
.gradient-text {
  color: var(--accent);
  background: linear-gradient(95deg, #8dffda, #83dfdf 58%, #c0a4fb);
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.title-star {
  display: inline-block;
  font-size: 47px;
  margin-left: 18px;
  color: var(--pink);
  -webkit-text-fill-color: var(--pink);
  vertical-align: top;
  animation: orbit 32s linear infinite;
}
.hero-description {
  color: #9da9c1;
  font-size: 14px;
  line-height: 1.9;
}
.hero-actions {
  display: flex;
  gap: 24px;
  align-items: center;
  margin-top: 30px;
}
.primary-link {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  background: var(--accent);
  border: 1px solid #a4fbe1;
  color: #09271e;
  font-size: 13px;
  font-weight: 700;
  border-radius: 10px;
  padding: 12px 20px;
  box-shadow: 0 0 30px #76f7d01c;
  transition: 0.2s;
}
.primary-link:hover {
  transform: translateY(-3px);
  box-shadow: 0 7px 28px #76f7d033;
}
.primary-link span {
  font-size: 20px;
  line-height: 1;
}
.secondary-link {
  font-size: 12px;
  color: #cbd2e2;
}
.secondary-link span {
  margin-left: 10px;
  color: var(--accent);
}
.hero-bottom {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 10px;
  color: #858fa7;
  margin-top: 33px;
}
.tiny-stars {
  letter-spacing: 2px;
  color: #d5b4f2;
}
.hero-bottom i {
  height: 1px;
  width: 60px;
  background: #323a4b;
}
.ticker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 17px 0;
  border-block: 1px solid #272f43;
  font:
    10px ui-monospace,
    monospace;
  letter-spacing: 0.1em;
  color: #a0abc2;
  overflow: hidden;
  white-space: nowrap;
}
.ticker b {
  color: var(--pink);
  font-size: 17px;
}
.tools-section {
  padding: 37px 0 30px;
}
.tools-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  margin-bottom: 24px;
}
.tools-heading h2 {
  font-size: 25px;
  margin-top: 9px;
  letter-spacing: -0.04em;
}
.tools-heading h2 span {
  color: var(--accent);
}
.tools-count {
  font-size: 11px;
  color: #8f9bb6;
}
.tools-count span {
  color: var(--accent);
  margin-left: 12px;
  font-size: 22px;
}
.tool-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.tool-card {
  --card-accent: #76f7d0;
  position: relative;
  overflow: hidden;
  padding: 24px;
  background: linear-gradient(145deg, #161e2c, #0e1420);
  border: 1px solid #2a3645;
  border-radius: 18px;
  transition:
    transform 0.3s,
    border-color 0.3s,
    box-shadow 0.3s;
}
.tool-card:hover {
  transform: translateY(-7px);
  border-color: var(--card-accent);
  box-shadow: 0 18px 45px #0004;
}
.tool-skland {
  --card-accent: #b9a4ff;
  background: linear-gradient(145deg, #211c35, #121321);
  border-color: #353047;
}
.tool-account {
  --card-accent: #ff9fc9;
  background: linear-gradient(145deg, #2b1d2e, #171321);
  border-color: #3c2b3d;
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tool-icon {
  width: 35px;
  height: 35px;
  display: grid;
  place-items: center;
  color: var(--card-accent);
  background: #ffffff08;
  border: 1px solid #ffffff10;
  border-radius: 10px;
  font-size: 20px;
}
.tool-card .pill {
  font-size: 10px;
  color: var(--card-accent);
  border-color: #ffffff16;
}
.tool-art {
  height: 116px;
  position: relative;
  margin: 8px 0 13px;
}
.tool-info h3 {
  font-size: 19px;
  margin: 8px 0 12px;
}
.tool-info > p:not(.section-label) {
  font-size: 12px;
  color: #9da8be;
  line-height: 1.9;
}
.tool-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #ffffff0d;
  margin-top: 24px;
  padding-top: 16px;
  color: var(--card-accent);
  font-size: 12px;
}
.tool-cta > span {
  font-size: 19px;
  transition: transform 0.2s;
}
.tool-card:hover .tool-cta > span {
  transform: translate(3px, -3px);
}
.industrial-art {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  perspective: 400px;
}
.industrial-art i {
  width: 49px;
  height: 82px;
  border: 1px solid #76f7d076;
  background: linear-gradient(130deg, #76f7d03d, #142822);
  transform: rotate(-27deg) skewY(15deg);
  box-shadow: 8px 8px 0 #76f7d011;
}
.industrial-art i:nth-child(2) {
  height: 105px;
  background: linear-gradient(130deg, #96f8d883, #174137);
}
.industrial-art span {
  position: absolute;
  font:
    italic 48px ui-monospace,
    monospace;
  color: #c7ffec;
  letter-spacing: -0.1em;
  text-shadow: 0 2px 12px #132a22;
}
.calendar-art > div {
  width: 108px;
  height: 100px;
  position: absolute;
  left: calc(50% - 55px);
  top: 6px;
  background: linear-gradient(135deg, #534074, #211d3a);
  border: 1px solid #b9a4ff80;
  border-radius: 12px;
  transform: rotate(-9deg);
  box-shadow: 9px 7px 0 #b9a4ff0e;
  text-align: center;
}
.calendar-art div > span {
  display: block;
  border-bottom: 1px solid #b9a4ff33;
  padding: 7px;
  font:
    8px ui-monospace,
    monospace;
  color: #d8c9fa;
}
.calendar-art strong {
  display: block;
  font-size: 44px;
  line-height: 1.4;
  font-weight: 400;
  color: #d9c9ff;
}
.calendar-art i {
  position: absolute;
  bottom: 5px;
  right: -32px;
  font:
    9px ui-monospace,
    monospace;
  background: #332744;
  border: 1px solid #b9a4ff66;
  border-radius: 6px;
  padding: 6px 10px;
  color: #d5bcff;
}
.calendar-art b {
  position: absolute;
  top: 8px;
  left: 23%;
  color: #b9a4ff;
  font-size: 27px;
}
.id-card {
  width: 152px;
  height: 93px;
  position: absolute;
  left: calc(50% - 76px);
  top: 12px;
  background: linear-gradient(135deg, #683c57, #2c2037);
  border: 1px solid #ff9fc966;
  border-radius: 10px;
  transform: rotate(9deg);
  box-shadow: 8px 8px 0 #ff9fc90a;
  padding: 12px;
}
.id-card > span {
  font:
    8px ui-monospace,
    monospace;
  color: #f8bfdc;
}
.id-card > div {
  font-size: 26px;
  color: #ffbfdf;
  position: relative;
  line-height: 1.4;
}
.id-card i {
  position: absolute;
  height: 4px;
  width: 58px;
  top: 12px;
  left: 42px;
  border-radius: 3px;
  background: #ffb6df60;
}
.id-card i + i {
  width: 36px;
  top: 24px;
}
.id-card b {
  display: block;
  font-size: 9px;
  letter-spacing: 0.18em;
  color: #e7b6ce;
}
.id-spark {
  position: absolute;
  top: 0;
  right: 19%;
  color: #ffbddd;
  font-size: 29px;
}
.health-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  border: 1px solid #293244;
  border-radius: 14px;
  background: #111726b0;
  padding: 22px 25px;
}
.health-caption {
  display: flex;
  align-items: center;
  gap: 15px;
}
.health-icon {
  font-size: 24px;
  color: #a4b4d0;
}
.health-caption h3 {
  font-size: 13px;
  font-weight: 500;
}
.health-caption p {
  font-size: 11px;
  color: var(--muted);
  margin-top: 3px;
}
.health-panel .el-button {
  font-size: 11px;
  background: #ffffff03;
}
.health-panel .el-button span {
  margin-left: 8px;
}
.health-status {
  width: 100%;
}
@media (min-width: 1500px) {
  .hero {
    padding-block: 25px 65px;
  }
}
@media (max-width: 1000px) {
  .hero {
    gap: 10px;
  }
  .edition {
    display: none;
  }
  .hero h1 {
    font-size: 55px;
  }
  .title-star {
    font-size: 35px;
    margin-left: 8px;
  }
  .tool-card {
    padding: 19px;
  }
  .tool-info h3 {
    font-size: 16px;
  }
  .ticker span:last-of-type {
    display: none;
  }
}
@media (max-width: 760px) {
  .hero {
    grid-template-columns: 1fr;
    padding-bottom: 25px;
  }
  .hero-copy {
    padding-top: 10px;
  }
  .hero h1 {
    font-size: 55px;
  }
  .hero-art {
    max-width: 470px;
    width: 100%;
    margin: 10px auto 0;
  }
  .hero-actions {
    gap: 20px;
  }
  .tool-grid {
    grid-template-columns: 1fr;
  }
  .tool-card {
    padding: 23px;
  }
  .tool-art {
    position: absolute;
    width: 130px;
    right: 14px;
    top: 95px;
    opacity: 0.25;
  }
  .tool-info {
    position: relative;
    padding-top: 20px;
  }
  .tool-info h3 {
    font-size: 20px;
  }
  .tool-info > p:not(.section-label) {
    max-width: 220px;
  }
  .tool-info .section-label {
    font-size: 9px;
  }
  .tools-heading h2 {
    font-size: 22px;
  }
  .tools-count {
    display: none;
  }
  .health-panel {
    padding: 20px;
  }
  .ticker {
    font-size: 8px;
  }
  .hero-bottom {
    margin-top: 26px;
  }
}

.hero {
  position: relative;
  isolation: isolate;
  border-radius: 28px;
  border: 1px solid #8fa2d327;
  background:
    radial-gradient(ellipse at 90% 20%, #9d78f512, transparent 50%),
    linear-gradient(120deg, #101d253b, #17132340);
  margin: 0 -24px 30px;
  padding: 38px 24px 42px;
}
.hero-copy {
  position: relative;
  z-index: 1;
}
.hero-watermark {
  position: absolute;
  left: 25px;
  bottom: -6px;
  font:
    900 clamp(110px, 14vw, 180px)/1 system-ui,
    sans-serif;
  letter-spacing: -0.07em;
  color: transparent;
  -webkit-text-stroke: 1px #9aacd518;
  z-index: -1;
  pointer-events: none;
}
.hero-corner {
  position: absolute;
  width: 38px;
  height: 38px;
  pointer-events: none;
}
.corner-one {
  top: -1px;
  left: -1px;
  border-top: 2px solid var(--accent);
  border-left: 2px solid var(--accent);
  border-radius: 28px 0 0;
}
.corner-two {
  bottom: -1px;
  right: -1px;
  border-bottom: 2px solid var(--pink);
  border-right: 2px solid var(--pink);
  border-radius: 0 0 28px;
}
.hero-visual {
  position: relative;
  min-width: 0;
  height: 440px;
}
.visual-index {
  position: absolute;
  left: 4%;
  top: 8%;
  font:
    38px/1 Georgia,
    serif;
  color: var(--accent);
  transform: rotate(-12deg);
  z-index: 1;
}
.visual-index > span {
  display: block;
  font:
    7px ui-monospace,
    monospace;
  letter-spacing: 0.1em;
  color: var(--muted);
  margin-top: 4px;
}
.visual-sticker {
  position: absolute;
  bottom: 1%;
  right: 6%;
  border-radius: 5px;
  padding: 7px 12px;
  background: #e7ffc2;
  color: #344929;
  transform: rotate(-8deg);
  font-size: 11px;
  font-weight: 700;
  box-shadow: 3px 4px 0 #11282044;
}
.visual-sticker span {
  margin-left: 14px;
}
.card-index {
  position: absolute;
  right: 20px;
  top: 60px;
  color: transparent;
  -webkit-text-stroke: 1px #a7b7df22;
  font:
    italic 76px/1 ui-monospace,
    monospace;
  pointer-events: none;
}
.tool-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 12%;
  right: 12%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--card-accent), transparent);
  opacity: 0.75;
}
.tool-card::after {
  content: '';
  position: absolute;
  pointer-events: none;
  width: 65%;
  height: 160%;
  top: -30%;
  left: -100%;
  background: linear-gradient(90deg, transparent, #ffffff0d, transparent);
  transform: rotate(22deg);
  transition: left 0.65s ease;
}
.tool-card:focus-visible::after {
  left: 140%;
}
.tool-art {
  transition: transform 0.4s cubic-bezier(0.2, 0.7, 0.3, 1);
}
.primary-link {
  position: relative;
  overflow: hidden;
}
.primary-link::after {
  content: '';
  pointer-events: none;
  position: absolute;
  inset: -100% auto -100% -60%;
  width: 40%;
  transform: rotate(25deg);
  background: linear-gradient(90deg, transparent, #ffffff65, transparent);
  transition: left 0.6s ease;
}
.primary-link:hover::after,
.primary-link:focus-visible::after {
  left: 130%;
}
.ticker {
  position: relative;
  background: linear-gradient(90deg, #76f7d007, #bb98fb0b, #ff78bd07);
}
.ticker::after {
  content: '';
  position: absolute;
  left: 15%;
  right: 15%;
  bottom: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #a79bd780, transparent);
}
@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .tool-card:hover .tool-art {
    transform: translateY(-8px) rotate(-3deg) scale(1.07);
  }
  .tool-card:hover::after {
    left: 140%;
  }
  .hero-visual:hover :deep(.planet) {
    filter: saturate(1.2) brightness(1.07);
  }
}
@media (max-width: 760px) {
  .hero {
    margin: 0 0 24px;
    padding: 24px 18px 32px;
  }
  .hero-visual {
    height: 350px;
  }
  .hero-watermark {
    font-size: 100px;
    bottom: 0;
    left: 10px;
  }
  .visual-index {
    display: none;
  }
  .visual-sticker {
    bottom: -5px;
  }
  .card-index {
    font-size: 55px;
    top: 65px;
    right: 20px;
  }
  .hero h1 {
    font-size: clamp(38px, 10vw, 55px);
  }
  .hero-actions {
    gap: 14px;
    flex-wrap: wrap;
  }
  .hero-description {
    font-size: 13px;
  }
  .hero-kicker .eyebrow {
    font-size: 9px;
    letter-spacing: 0.14em;
  }
}
</style>
