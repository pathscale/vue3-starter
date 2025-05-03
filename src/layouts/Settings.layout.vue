<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const routeName = computed(() => route.name as unknown as string);
</script>

<template>
  <div class="tabs is-boxed">
    <ul>
      <li :class="{ 'is-active': routeName === 'encryptedKeys' }">
        <router-link :to="{ name: 'encryptedKeys' }">
          <span>Encrypted Keys</span>
        </router-link>
      </li>
      <li :class="{ 'is-active': routeName === 'appDebug' }">
        <router-link :to="{ name: 'appDebug' }">
          <span>App Debug</span>
        </router-link>
      </li>
    </ul>
  </div>
  <div>
    <slot />
  </div>
</template>
