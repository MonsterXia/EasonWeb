import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
const IndexPage = () => import('@/pages/home/IndexPage.vue')
const EndfieldPage = () => import('@/pages/game/hypergryph/endfield/EndfieldPage.vue')
const UserPage = () => import('@/pages/user/userPage.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
              component: EndfieldPage
            }
          ]
        },
      ]
    },
    {
      path: '/user',
      name: 'user',
      component: UserPage
    }
  ],
})

export default router
