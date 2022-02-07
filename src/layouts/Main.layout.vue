<script lang="ts">
import authStore from '~/store/modules/auth.module'

import { CustomFooter } from './components'
import AppLayout from './App.layout.vue'

export default {
  name: 'Layout',
  components: { AppLayout, CustomFooter },
  setup() {
    return { authStore }
  },
}
</script>

<template>
  <template v-if="authStore.logged">
    <app-layout />
  </template>
  <router-view v-else />
  <custom-footer />
</template>
