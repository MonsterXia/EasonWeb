<script setup lang="ts">
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { RouterView } from 'vue-router'
import Navigator from './components/Navigator.vue'
</script>

<template>
  <el-config-provider :locale="zhCn">
    <div class="ambient" aria-hidden="true">
      <i /><i />
      <div class="aurora-ribbon" />
      <div class="ambient-stars" />
    </div>
    <a class="skip-link" href="#main-content">跳至主要内容</a>
    <Navigator />
    <main id="main-content" class="site-main" tabindex="-1">
      <RouterView v-slot="{ Component }">
        <component :is="Component" class="route-page" />
      </RouterView>
    </main>
    <footer class="site-footer">
      <router-link to="/" class="footer-brand">EASON<span> / </span>PLAYGROUND</router-link>
      <span>为热爱而造 · 让日常多一点好玩</span>
      <span class="footer-note">STAY CURIOUS <b>✦</b></span>
    </footer>
  </el-config-provider>
</template>

<style scoped>
.aurora-ribbon {
  position: absolute;
  width: 140%;
  height: 48vh;
  top: 6%;
  left: -20%;
  background: linear-gradient(
    120deg,
    transparent 15%,
    #76f7d010 35%,
    #a889ff22 52%,
    #ff78bd12 65%,
    transparent 80%
  );
  filter: blur(40px);
  transform: rotate(-18deg);
  animation: aurora-drift 24s ease-in-out infinite;
}
.ambient-stars {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1px 1px at 17% 23%, #b4c9ff88 98%, transparent),
    radial-gradient(1px 1px at 77% 16%, #ffb1db88 98%, transparent),
    radial-gradient(1px 1px at 55% 63%, #9ff7d688 98%, transparent),
    radial-gradient(1px 1px at 89% 77%, #b4c9ff77 98%, transparent);
  background-size: 450px 390px;
  opacity: 0.5;
}
@keyframes aurora-drift {
  0%,
  100% {
    transform: translate3d(-3%, -4%, 0) rotate(-18deg);
    opacity: 0.5;
  }
  50% {
    transform: translate3d(3%, 6%, 0) rotate(-12deg);
    opacity: 1;
  }
}
@media (max-width: 700px) {
  .aurora-ribbon {
    animation: none;
    filter: blur(20px);
  }
  .ambient-stars {
    opacity: 0.25;
  }
}

.ambient {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
  background-image:
    linear-gradient(#93a7d104 1px, transparent 1px),
    linear-gradient(90deg, #93a7d104 1px, transparent 1px);
  background-size: 54px 54px;
}
.ambient i {
  position: absolute;
  width: 750px;
  height: 750px;
  border-radius: 50%;
  background: radial-gradient(circle, #6443b326, transparent 65%);
  top: -250px;
  right: -150px;
}
.ambient i + i {
  background: radial-gradient(circle, #1c806a13, transparent 65%);
  left: -400px;
  top: 300px;
}
.site-main {
  width: min(1200px, calc(100% - 80px));
  margin: 0 auto;
  min-height: calc(100vh - 198px);
  padding: 46px 0 64px;
}
.route-page {
  animation: appear 0.55s ease both;
}
.site-footer {
  max-width: 1200px;
  margin: 0 auto;
  padding: 25px 0;
  border-top: 1px solid #242b3c;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  color: #939eb6;
  font-size: 11px;
}
.footer-brand {
  color: #d4dced;
  letter-spacing: 0.1em;
  font-weight: 700;
}
.footer-brand span {
  color: var(--accent);
}
.footer-note {
  letter-spacing: 0.12em;
}
.footer-note b {
  color: var(--pink);
  margin-left: 12px;
}
.skip-link {
  position: fixed;
  top: -60px;
  left: 20px;
  z-index: 100;
  background: var(--accent);
  color: #080b14;
  padding: 10px;
  border-radius: 8px;
}
.skip-link:focus {
  top: 10px;
}
@media (max-width: 1280px) {
  .site-footer {
    margin-inline: 40px;
  }
}
@media (max-width: 700px) {
  .site-main {
    width: calc(100% - 36px);
    padding: 30px 0 42px;
  }
  .site-footer {
    margin-inline: 18px;
    flex-wrap: wrap;
    gap: 8px 20px;
  }
  .footer-note {
    display: none;
  }
}
</style>
