import { createRouter, createWebHistory } from 'vue-router'
import { Login, HelloWorld } from '~/pages'

import authStore from '../store/modules/auth'
import Main from '~/layouts/Main.vue'

const routes = [
  {
    path: '/',
    component: Main,
    children: [
      {
        name: 'login',
        path: '',
        component: Login,
      },
      {
        name: 'home',
        path: '',
        component: HelloWorld,
      },
    ],
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.private)) {
    if (!authStore.logged) {
      next({ name: 'login' })
    } else {
      next()
    }
  } else {
    next()
  }
})
