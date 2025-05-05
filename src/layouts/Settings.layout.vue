<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const routeName = computed(() => route.name as unknown as string);
</script>

<template>
  <div class="tabs is-boxed">
    <ul>
      <li :class="{ 'is-active': routeName === 'appDebug' }">
        <router-link :to="{ name: 'appDebug' }">
          <span>App Config</span>
        </router-link>
      </li>
    </ul>
  </div>
  <div>
    <slot />
  </div>
</template>
