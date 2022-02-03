import { createRouter, createWebHistory } from 'vue-router'

import authStore from '~/store/modules/auth'
import routes from './routes'

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.private)) {
    if (!authStore.logged) {
      next({ name: 'login' })
    } else next()
  } else {
    next()
  }
})
