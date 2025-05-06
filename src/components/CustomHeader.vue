<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Submenu1, Submenu2 } from "~/components";
import { DashboardRoutes } from "~/router/routes";
import DashboardMenu from "./DashboardMenu.vue";

const menuItems = computed(() => {
  const routes = DashboardRoutes;
  return routes.filter((e) => e.isMenuItem);
});

const router = useRouter();
const isActive = ref(false);

const route = useRoute();

const showStrategies = computed(() => route.path.includes("strategies"));

const logout = () => {
  router.push("/login");
};

const isLoggedIn = computed(() => {
  localStorage.getItem("userToken");
  return !!localStorage.getItem("userToken");
});

const handleClickOutside = (event: MouseEvent) => {
  if (showStrategies.value) {
    const navbar = document.querySelector(".navbar");
    if (navbar && !navbar.contains(event.target as Node)) {
      isActive.value = false;
    }
  } else {
    const navbarBrand = document.querySelector(".navbar-brand");
    if (navbarBrand && !navbarBrand.contains(event.target as Node)) {
      isActive.value = false;
    }
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <v-navbar class="is-fixed w-full" v-model="isActive">
    <template #start>
      <template v-if="!isLoggedIn">
        <v-navbar-item class="is-capitalized has-text-weight-semibold" href="/" :active="true">Home</v-navbar-item>
      </template>
      <dashboard-menu v-if="isLoggedIn" :menu-items="menuItems" />
      <div v-if="showStrategies" class="is-hidden-desktop">
        <submenu1 />
        <submenu2 />
      </div>
    </template>
    <template #end>
      <template v-if="isLoggedIn">
        <v-navbar-item tag="router-link" :to="{ name: 'appDebug' }" :is-active="true"
          class="is-flex is-align-items-center">
          <icon name="settings" fill="black" />
          <span class="ml-2 is-hidden-desktop">Settings</span>
        </v-navbar-item>
        <v-navbar-item @click="logout" class="is-flex is-align-items-center">
          <icon name="logout" fill="black" />
          <span class="ml-2 is-hidden-desktop">Logout</span>
        </v-navbar-item>
      </template>
      <template v-else>
        <div class="buttons mr-1">
          <v-button tag="router-link" :to="{ name: 'login' }">
            <strong>Sign-up or Login</strong>
          </v-button>
        </div>
      </template>
    </template>
  </v-navbar>
</template>

<style>
</style>
