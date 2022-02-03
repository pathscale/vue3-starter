<script>
import { VNavbar, VNavbarItem } from '@pathscale/vue3-ui'
import { logout } from '~/store/modules/auth'

export default {
  name: 'Navbar',
  components: { VNavbar, VNavbarItem },
  setup() {
    return { logout }
  },
}
</script>

<template>
  <v-navbar class="pl-4 pr-4">
    <template #brand>
      <v-navbar-item>
        <router-link to="/wallet">
          <strong class="has-text-dark">Infinity Guild</strong>
        </router-link>
      </v-navbar-item>
    </template>

    <template #end>
      <v-navbar-dropdown label="Menu" hoverable right>
        <v-navbar-item @click="logout" class="has-text-danger"> Log out </v-navbar-item>
      </v-navbar-dropdown>
    </template>

    <!-- Purger Whitelist -->
    <a v-if="false" class="navbar-burger">
      <span aria-hidden="true" />
    </a>
  </v-navbar>
</template>
