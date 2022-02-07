<script lang="ts">
import { onMounted } from 'vue'

import { setTheme, light } from '~/theming'
import wssConfigure from '~/api/wssConfigure'

export default {
  name: 'App',
  setup() {
    wssConfigure()
    onMounted(() => {
      setTheme(light)
    })
  },
}
</script>


<template>
  <router-view />
  <!-- rollup-plugin-vue3-ui-css-purge whitelist -->
  <div v-if="false">
    <v-button class="is-loading" />
  </div>
</template>
