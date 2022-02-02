import { createRouter, createWebHistory } from 'vue-router'
import { Wallet, Loans, Account, Card, Settings, Login } from '~/pages'

import authStore from '../store/modules/auth'
import Main from '~/common/layouts/Main.vue'

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
        name: 'wallet',
        path: 'wallet',
        component: Wallet,
        meta: { private: true },
      },
      {
        name: 'loans',
        path: 'loans',
        component: Loans,
        meta: { private: true },
      },
      {
        name: 'account',
        path: 'account',
        component: Account,
        meta: { private: true },
      },
      {
        name: 'card',
        path: 'card',
        component: Card,
        meta: { private: true },
      },
      {
        name: 'settings',
        path: 'settings',
        component: Settings,
        meta: { private: true },
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
    } else next()
  } else {
    next()
  }
})
