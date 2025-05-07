<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ThemeBuilder } from '~/components'

const route = useRoute()
const router = useRouter()
const routeName = computed(() => route.name as unknown as string)

onMounted(() => {
  const userToken = localStorage.getItem('userToken')
  if (userToken) {
    router.push({
      name: 'dashboardHome'
    })
  }
})


</script>

<template>
  <custom-header />
  <div class="container-fluid section is-flex-1 is-flex pb-0" style="margin-top: 5rem;">
    <v-columns hcentered class="is-flex-1">
      <v-column size="is-6 is-3-fullhd">
        <div class="box">
          <div class="tabs is-fullwidth">
            <ul>
              <li :class="{ 'is-active': ['login', 'forgotPassword'].includes(routeName) }">
                <router-link :to="{ name: 'login' }">
                  <span>Login</span>
                </router-link>
              </li>
              <li :class="{ 'is-active': routeName === 'signup' }">
                <router-link :to="{ name: 'signup' }">
                  <span>Create Account</span>
                </router-link>
              </li>
              <li :class="{ 'is-active': routeName === 'switchServer' }">
                <router-link :to="{ name: 'switchServer' }">
                  <span>Switch Server</span>
                </router-link>
              </li>
            </ul>
          </div>
          <div>
            <router-view />
          </div>
        </div>
      </v-column>
      <v-column size="is-1" />
    </v-columns>
  </div>
  <custom-footer />
</template>
