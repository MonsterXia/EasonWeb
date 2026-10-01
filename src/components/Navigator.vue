<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
const { preference, isDark, setTheme } = useTheme()
const route = useRoute()
const links = [
  { path: '/', title: '首页', icon: 'House' },
  { path: '/game/hypergryph/endfield', title: '终末地', icon: 'Aim' },
  { path: '/game/hypergryph/skland', title: '森空岛', icon: 'Calendar' },
]
</script>
<template>
  <header class="site-header">
    <div class="nav-inner">
      <router-link to="/" class="brand" aria-label="Eason 首页"
        ><span class="brand-mark">e<span>✦</span></span
        ><span>EASON<span class="brand-suffix">.SPACE</span></span></router-link
      >
      <nav aria-label="主导航">
        <router-link
          v-for="link in links"
          :key="link.path"
          :to="link.path"
          :class="{ active: route.path === link.path }"
          :aria-current="route.path === link.path ? 'page' : undefined"
          ><el-icon><component :is="link.icon" /></el-icon>{{ link.title }}</router-link
        >
      </nav>
      <div class="nav-actions">
        <el-dropdown trigger="click" @command="setTheme">
          <button
            class="theme-button"
            type="button"
            :aria-label="`切换主题，当前${preference === 'system' ? '跟随系统' : isDark ? '深色模式' : '浅色模式'}`"
            title="切换主题"
          >
            <el-icon
              ><Monitor v-if="preference === 'system'" /><Moon v-else-if="isDark" /><Sunny v-else
            /></el-icon>
            <span class="theme-label">{{
              preference === 'system' ? '自动' : isDark ? '深色' : '浅色'
            }}</span>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                command="light"
                :class="{ 'theme-selected': preference === 'light' }"
                ><el-icon><Sunny /></el-icon>浅色模式<span
                  v-if="preference === 'light'"
                  aria-label="已选择"
                >
                  ✓</span
                ></el-dropdown-item
              >
              <el-dropdown-item command="dark" :class="{ 'theme-selected': preference === 'dark' }"
                ><el-icon><Moon /></el-icon>深色模式<span
                  v-if="preference === 'dark'"
                  aria-label="已选择"
                >
                  ✓</span
                ></el-dropdown-item
              >
              <el-dropdown-item
                command="system"
                :class="{ 'theme-selected': preference === 'system' }"
                ><el-icon><Monitor /></el-icon>跟随系统<span
                  v-if="preference === 'system'"
                  aria-label="已选择"
                >
                  ✓</span
                ></el-dropdown-item
              >
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <router-link
          to="/user"
          aria-label="用户中心"
          class="account-link"
          :class="{ active: route.path === '/user' }"
          ><el-icon><User /></el-icon><span>用户中心</span
          ><span class="account-arrow">↗</span></router-link
        >
      </div>
    </div>
  </header>
</template>
<style scoped>
.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.theme-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 38px;
  padding: 7px 10px;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: var(--color-background-soft);
  color: var(--color-text);
  cursor: pointer;
  font-size: 12px;
}
.theme-button:hover {
  color: var(--accent);
  border-color: var(--accent);
}
.theme-selected {
  color: var(--accent);
  font-weight: 700;
}
@media (max-width: 900px) {
  .theme-label {
    display: none;
  }
  .nav-inner {
    gap: 12px;
  }
}
@media (max-width: 400px) {
  .account-link > span {
    display: none;
  }
  .account-link {
    min-height: 38px;
  }
  .brand {
    gap: 8px;
  }
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 30;
  border-bottom: 1px solid #ffffff0c;
  background: #090d17dc;
  backdrop-filter: blur(20px);
}
.nav-inner {
  max-width: 1280px;
  min-height: 80px;
  padding: 0 40px;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  letter-spacing: 0.09em;
  color: #fff;
  font-weight: 800;
}
.brand-suffix {
  color: #8791ab;
  font-weight: 400;
  font-size: 12px;
}
.brand-mark {
  width: 33px;
  height: 33px;
  display: grid;
  place-items: center;
  position: relative;
  color: #0a1c18;
  background: var(--accent);
  border-radius: 10px;
  font-size: 29px;
  font-style: italic;
  line-height: 1;
}
.brand-mark span {
  position: absolute;
  color: var(--pink);
  right: -7px;
  top: -6px;
  font-size: 16px;
}
nav {
  display: flex;
  gap: 8px;
}
nav a {
  padding: 9px 19px;
  border: 1px solid transparent;
  border-radius: 9px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a7b1c6;
  font-size: 13px;
  transition: 0.2s;
}
nav a:hover {
  color: #fff;
  background: #ffffff06;
}
nav a.active {
  color: var(--accent);
  background: #76f7d00b;
  border-color: #76f7d01f;
}
.account-link {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 12px;
  border: 1px solid #343c50;
  padding: 8px 13px;
  border-radius: 9px;
}
.account-link:hover,
.account-link.active {
  color: var(--accent);
  border-color: #76f7d066;
}
.account-arrow {
  margin-left: 7px;
  color: var(--accent);
}
@media (max-width: 760px) {
  .nav-inner {
    flex-wrap: wrap;
    padding: 16px 18px 10px;
    gap: 15px;
  }
  .brand {
    font-size: 14px;
  }
  nav {
    order: 3;
    width: 100%;
    justify-content: center;
  }
  nav a {
    flex: 1;
    justify-content: center;
    padding: 8px;
  }
  .account-arrow {
    display: none;
  }
}
</style>
