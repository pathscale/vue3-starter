<script>
import { onMounted, computed } from 'vue'

import { setTheme, light } from '~/theming'
import authStore from '~/store/modules/auth'
import wssConfigure from '~/api/wssConfigure'

import { Navbar, Sidebar, CustomFooter } from './components'

export default {
  name: 'Layout',
  components: { Navbar, Sidebar, CustomFooter },
  setup() {
    wssConfigure()
    const logged = computed(() => authStore.logged)
    onMounted(() => {
      setTheme(light)
    })

    return { logged }
  },
}
</script>

<template>
  <template v-if="logged">
    <navbar />
    <div class="main">
      <sidebar class="sidebar-wrapper" />
      <div class="scrollable-content">
        <div style="flex: 1;">
          <router-view />
        </div>
      </div>
    </div>
  </template>
  <router-view v-else />
  <custom-footer />
  <!-- rollup-plugin-vue3-ui-css-purge whitelist -->
  <div v-if="false">
    <v-button class="is-loading" />
  </div>
</template>

<style>
header {
  border-bottom: 0.5px solid #eceef2;
}

.sidebar-wrapper {
  min-width: 200px;
  overflow-y: auto;
}

.main {
  flex-grow: 1;
  display: flex;
  flex-direction: row;

  /* for Firefox */
  min-height: 0;
  background: var(--blm-grey-lightest);
}

.scrollable-content {
  flex-grow: 1;
  overflow: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
