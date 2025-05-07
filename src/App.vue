<script lang="ts" setup>
import { onMounted } from 'vue'
import { setTheme, dark } from '~/theming'
import { $toast } from './main'
import wssConfigure, { cleanupLocalStorageOnLogout } from '~/api/wssConfigure'
import { useLogin } from '~/mutations'

wssConfigure()
const { init } = useLogin()
onMounted(() => {
  setTheme(dark)
  init.mutate(undefined, {
    onError: error => {
      $toast.error(error.message)
      cleanupLocalStorageOnLogout()
    }
  })
})
</script>

<template>
  <router-view />
  <!-- css purger whitelist -->
  <div v-if="false" class="v-toast-container v-toast-container--bottom is-hidden">
    <div class="notification is-success is-danger is-warning v-toast--bottom-right" />
  </div>
</template>
