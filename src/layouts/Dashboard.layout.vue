<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  CustomFooter,
  CustomHeader,
  Submenu1,
  Submenu2,
  ThemeBuilder,
} from "~/components";

const router = useRouter();
const route = useRoute();

const showStrategies = computed(() => route.path.includes("strategies"));

const isLoggedIn = computed(() => {
  localStorage.getItem("userToken");
  return !!localStorage.getItem("userToken");
});

onMounted(() => {
  const userToken = localStorage.getItem("userToken");
  if (!userToken) {
    router.push({ path: "/", query: { redirect: route.fullPath } });
  }
});

const showThemeBuilder = ref(false);
</script>

<template>
  <template v-if="isLoggedIn">
    <div class="is-fixed w-full custom-navbar" style="z-index: 1;">
      <custom-header />
      <div v-if="showStrategies" class="mt-6 is-hidden-touch">
        <submenu1 />
        <submenu2 />
      </div>
    </div>

    <div class="container-fluid section main-section is-flex is-flex-direction-column margin-top">
      <div class="box mt-3"> <router-view /></div>
    </div>
  </template>
  <div v-else class="container-fluid section main-section is-flex is-flex-direction-column pt-4">
    <custom-header />
    <router-view />
  </div>
  <custom-footer />
</template>

<style>
.mt-6 {
  margin-top: var(--blm-nav-height) !important;
}

.margin-top {
  margin-top: 67px;
}

@media screen and (max-width: 768px) {
  .margin-top {
    margin-top: 16px;
  }
}

@media screen and (max-width: 1024px) and (orientation: landscape) {
  .margin-top {
    margin-top: 0;
  }
}


@media screen and (max-width: 768px) {
  .section {
    padding: 1rem;
  }
}

@media screen and (max-width: 768px) {
  .px-5 {
    padding: 0 16px !important
  }
}

.custom-navbar .tabs ul {
  border-bottom: 0 !important;
}
</style>
