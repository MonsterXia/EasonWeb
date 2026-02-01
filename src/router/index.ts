import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
const IndexPage = () => import('@/pages/home/IndexPage.vue')
const EndfieldPage = () => import('@/pages/game/hypergryph/endfield/EndfieldPage.vue')

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
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      children: [
        {
          path: 'endfield',
          name: 'endfield',
          component: EndfieldPage
        }
      ]
      // component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
