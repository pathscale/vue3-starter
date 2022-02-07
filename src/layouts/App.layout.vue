<script lang="ts">
import { Navbar, Sidebar } from './components'
import useLogin from '~/pages/Auth/Login/hooks/useLogin'

export default {
  name: 'Layout',
  components: { Navbar, Sidebar },
  setup() {
    const { logout } = useLogin()
    return { logout }
  },
}
</script>

<template>
  <div class="main is-100-height">
    <sidebar @logout="logout" class="is-hidden-mobile" />
    <div class="is-flex-1">
      <navbar @logout="logout" />
      <div class="section">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
.main {
  display: flex;
  flex: 1;
}

.is-flex-1 {
  flex: 1;
  overflow: auto;
}
</style>

