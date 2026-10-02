import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { tr } from '@/i18n'
import { createChunkRecovery } from './chunkRecovery'

const IndexPage = () => import('@/pages/home/IndexPage.vue')
const EndfieldPage = () => import('@/pages/game/hypergryph/endfield/EndfieldPage.vue')
const UserPage = () => import('@/pages/user/userPage.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { top: 0 }
  },
  routes: [
    ...['/login', '/register', '/reset-password'].map((path) => ({
      path,
      component: () => import('@/pages/auth/AuthPage.vue'),
    })),
    {
      path: '/game/hypergryph/skland',
      component: () => import('@/pages/game/hypergryph/SklandPage.vue'),
    },
    {
      path: '/',
      name: 'home',
      component: IndexPage,
    },
    {
      path: '/game',
      name: 'game',
      children: [
        {
          path: 'hypergryph',
          name: 'hypergryph',
          children: [
            {
              path: 'endfield',
              name: 'endfield',
              component: EndfieldPage,
            },
          ],
        },
      ],
    },
    {
      path: '/user',
      name: 'user',
      component: UserPage,
    },
  ],
})

const recoverChunk = createChunkRecovery({
  storage: () => window.sessionStorage,
  navigate: (path) => window.location.assign(path),
  online: () => navigator.onLine,
})
router.onError((error, to) => {
  if (!recoverChunk(error, to.fullPath)) ElMessage.error(tr('shell.navigationFailed'))
})

export default router
