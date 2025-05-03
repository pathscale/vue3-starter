<script lang="ts" setup>
import { defineProps } from "vue";

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div class="loader-wrapper">
    <progress v-if="loading" class="progress is-light" />
  </div>
</template>

<style scoped>
.loader-wrapper {
  height: 5px;
  min-height: 1rem;
  margin-bottom: 1rem;
}
</style>
