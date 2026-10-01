import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './assets/main.css'

import App from './App.vue'
import router from './router'
import { i18n, startLocaleSync } from './i18n'

const app = createApp(App)

app.use(i18n)
const stopLocaleSync = startLocaleSync()
if (import.meta.hot) import.meta.hot.dispose(stopLocaleSync)
app.use(createPinia())
app.use(router)

app.use(ElementPlus)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.mount('#app')
