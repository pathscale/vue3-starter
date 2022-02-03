<script>
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'Sidebar',
  setup() {
    const route = useRoute()
    const router = useRouter()

    const sidebarItems = [
      {
        name: 'Wallet',
        icon: 'wallet',
        path: 'wallet',
      },
      {
        name: 'My loans',
        icon: 'loans',
        path: 'loans',
      },
      {
        name: 'Card services',
        icon: 'card',
        path: 'card',
      },
      {
        name: 'Account',
        icon: 'account',
        path: 'account',
      },
      {
        name: 'Settings',
        icon: 'settings',
        path: 'settings',
      },
    ]

    function active(...routeNames) {
      return routeNames.some(routeName => route.path.includes(routeName))
    }

    function push(routeName) {
      router.push({ name: routeName })
    }

    return { active, sidebarItems, push }
  },
}
</script>

<template>
  <v-menu>
    <v-menu-list>
      <v-menu-item
        class="py-4 px-4"
        v-for="(item, key) in sidebarItems"
        :key="key"
        @click="push(item.path)"
        :active="active(item.path)">
        <template #label>
          <div class="is-flex is-align-items-center">
            <v-icon :name="item.icon" bundle="icons" custom-class="menu-icon" />
            <span class="px-4"> {{ item.name }}</span>
          </div>
        </template>
      </v-menu-item>
    </v-menu-list>
  </v-menu>
</template>

<style>
.menu-icon {
  width: 25px;
  height: 25px;
  fill: var(--blm-grey-light) !important;
}

.is-active .menu-icon {
  fill: var(--blm-prim) !important;
}

.menu-list a.is-active {
  border-right: var(--blm-prim) 3px solid;
}

.is-active {
  color: var(--blm-prim) !important;
}

.menu {
  background-color: var(--blm-white-ter);
  font-size: 0.8rem;
}
</style>
