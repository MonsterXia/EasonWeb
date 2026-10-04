import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { tr } from '@/i18n'
import { createChunkRecovery } from './chunkRecovery'

import { routes } from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { top: 0 }
  },
  routes,
})

const recoverChunk = createChunkRecovery({
  storage: () => window.sessionStorage,
  navigate: (path) => window.location.assign(path),
  online: () => navigator.onLine,
})
router.onError((error, to) => {
  // Preserve the module-load diagnostic in the browser; the UI stays localized.
  console.error('Page navigation failed:', error)
  if (!recoverChunk(error, to.fullPath)) ElMessage.error(tr('shell.navigationFailed'))
})

export default router
