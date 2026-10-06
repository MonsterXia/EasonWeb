import type { RouteRecordRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    titleKey?: string
    descriptionKey?: string
  }
}

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/pages/home/IndexPage.vue') },
  ...(['login', 'register', 'reset-password'] as const).map((mode) => ({
    path: `/${mode}`,
    component: () => import('@/pages/auth/AuthPage.vue'),
    meta: {
      titleKey: `account.${mode === 'reset-password' ? 'reset' : mode}`,
      descriptionKey: `account.auth.${mode === 'reset-password' ? 'reset' : mode}Description`,
    },
  })),
  { path: '/game', redirect: '/game/hypergryph/endfield' },
  { path: '/game/hypergryph', redirect: '/game/hypergryph/endfield' },
  {
    path: '/game/hypergryph/endfield',
    name: 'endfield',
    component: () => import('@/pages/game/hypergryph/endfield/EndfieldPage.vue'),
    meta: { titleKey: 'game.growth.toolkitTitle' },
  },
  {
    path: '/game/hypergryph/skland',
    name: 'skland',
    component: () => import('@/pages/game/hypergryph/SklandPage.vue'),
    meta: { titleKey: 'game.skland.title', descriptionKey: 'game.skland.description' },
  },
  {
    path: '/user',
    name: 'user',
    component: () => import('@/pages/user/userPage.vue'),
    meta: { titleKey: 'account.profile.title', descriptionKey: 'account.profile.description' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFoundPage.vue'),
    meta: { titleKey: 'shell.notFoundTitle', descriptionKey: 'shell.notFoundDescription' },
  },
]
