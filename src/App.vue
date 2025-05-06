<script lang="ts" setup>
</script>

<template>
  <router-view />
  <!-- css purger whitelist -->
  <div v-if="false" class="v-toast-container v-toast-container--bottom is-hidden">
    <div class="notification is-success is-danger is-warning v-toast--bottom-right" />
  </div>
</template>
