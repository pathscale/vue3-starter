<script>
import { onMounted } from 'vue'

import { setTheme, light } from '~/theming'
import wssConfigure from '~/api/wssConfigure'

import { CustomFooter, Notification } from '~/components'

export default {
  name: 'Layout',
  components: { CustomFooter, Notification },
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
  <notification />
  <custom-footer />

  <!-- rollup-plugin-vue3-ui-css-purge whitelist -->
  <div v-if="false">
    <v-button class="is-loading" />
    <v-columns class="is-centered" />
    <table class="table is-bordered is-striped is-narrow is-hoverable is-fullwidth is-hidden">
      <thead>
        <tr>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr>
          <td />
        </tr>
      </tbody>
    </table>
  </div>
</template>
