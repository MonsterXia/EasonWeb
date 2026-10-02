import { createApp } from 'vue'
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
app.use(router)

app.mount('#app')
