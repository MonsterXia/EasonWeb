<script setup lang="ts">
import { House, Aim, Calendar, Sunny, Moon, Monitor, User } from '@element-plus/icons-vue'
import { ElIcon, ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus'
import SakuraBlossom from './SakuraBlossom.vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'
import { localePreference, setLocalePreference } from '@/i18n'
const { t, locale } = useI18n()
const { preference, isDark, setTheme } = useTheme()
const route = useRoute()
const links = [
  { path: '/', title: 'shell.home', icon: House },
  { path: '/game/hypergryph/endfield', title: 'shell.endfield', icon: Aim },
  { path: '/game/hypergryph/skland', title: 'shell.skland', icon: Calendar },
]
const themes = [
  { value: 'light', icon: Sunny },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
]
</script>
<template>
  <header class="site-header">
    <div class="nav-inner">
      <router-link to="/" class="brand" :aria-label="t('shell.brandHome')">
        <span class="brand-mark">e<SakuraBlossom class="brand-blossom" /></span>
        <span>EASON<span class="brand-suffix">.SPACE</span></span>
      </router-link>
      <nav :aria-label="t('shell.navigation')">
        <router-link
          v-for="link in links"
          :key="link.path"
          :to="link.path"
          :class="{ active: route.path === link.path }"
          :aria-current="route.path === link.path ? 'page' : undefined"
        >
          <el-icon><component :is="link.icon" /></el-icon>{{ t(link.title) }}
        </router-link>
      </nav>
      <div class="nav-actions">
        <el-dropdown trigger="click" @command="setLocalePreference">
          <button
            class="theme-button language-button"
            type="button"
            :aria-label="
              t('shell.languageCurrent', { language: locale === 'en' ? 'English' : '简体中文' })
            "
            :title="t('shell.language')"
          >
            <span aria-hidden="true" class="language-symbol">文/A</span>
            <span class="language-label">{{ locale === 'en' ? 'EN' : '中文' }}</span>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                command="zh-CN"
                :class="{ 'theme-selected': localePreference === 'zh-CN' }"
              >
                <span lang="zh-CN">简体中文</span
                ><span v-if="localePreference === 'zh-CN'" :aria-label="t('shell.selected')"
                  >✓</span
                >
              </el-dropdown-item>
              <el-dropdown-item
                command="en"
                :class="{ 'theme-selected': localePreference === 'en' }"
              >
                <span lang="en">English</span
                ><span v-if="localePreference === 'en'" :aria-label="t('shell.selected')">✓</span>
              </el-dropdown-item>
              <el-dropdown-item
                command="system"
                :class="{ 'theme-selected': localePreference === 'system' }"
              >
                {{ t('shell.system')
                }}<span v-if="localePreference === 'system'" :aria-label="t('shell.selected')"
                  >✓</span
                >
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown trigger="click" @command="setTheme">
          <button
            class="theme-button"
            type="button"
            :aria-label="t('shell.themeCurrent', { theme: t('shell.' + preference) })"
            :title="t('shell.theme')"
          >
            <el-icon
              ><Monitor v-if="preference === 'system'" /><Moon v-else-if="isDark" /><Sunny v-else
            /></el-icon>
            <span class="theme-label">{{ t('shell.' + preference + 'Short') }}</span>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="theme in themes"
                :key="theme.value"
                :command="theme.value"
                :class="{ 'theme-selected': preference === theme.value }"
              >
                <el-icon><component :is="theme.icon" /></el-icon>{{ t('shell.' + theme.value) }}
                <span v-if="preference === theme.value" :aria-label="t('shell.selected')">✓</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <router-link
          to="/user"
          :aria-label="t('shell.account')"
          class="account-link"
          :class="{ active: route.path === '/user' }"
        >
          <el-icon><User /></el-icon><span>{{ t('shell.account') }}</span
          ><span class="account-arrow">↗</span>
        </router-link>
      </div>
    </div>
  </header>
</template>
<style scoped>
.language-symbol {
  font-size: 11px;
  font-weight: 700;
}
.language-button {
  white-space: nowrap;
}
@media (max-width: 420px) {
  .language-label {
    display: none;
  }
  .nav-actions {
    gap: 6px;
  }
}
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
  border-bottom: 1px solid var(--border-header);
  background: var(--surface-header);
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
  color: var(--muted);
  font-weight: 400;
  font-size: 12px;
}
.brand-mark {
  width: 33px;
  height: 33px;
  display: grid;
  place-items: center;
  position: relative;
  color: var(--on-accent);
  background: var(--accent);
  border-radius: 10px;
  font-size: 29px;
  font-style: italic;
  line-height: 1;
}
.brand-mark .brand-blossom {
  position: absolute;
  color: var(--pink);
  right: -7px;
  top: -6px;
  width: 19px;
  height: 19px;
  transform: rotate(12deg);
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
  color: var(--color-text);
  font-size: 13px;
  transition: 0.2s;
}
nav a:hover {
  color: #fff;
  background: #ffffff06;
}
nav a.active {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 4%, transparent);
  border-color: color-mix(in srgb, var(--accent) 12%, transparent);
}
.account-link {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 12px;
  border: 1px solid var(--color-border);
  padding: 8px 13px;
  border-radius: 9px;
}
.account-link:hover,
.account-link.active {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
}
.account-arrow {
  margin-left: 7px;
  color: var(--accent);
}
@media (max-width: 900px) {
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
