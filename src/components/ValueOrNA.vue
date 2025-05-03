
<script lang="ts" setup>
defineProps({
  value: {
    type: Number,
  },
});
</script>

<template>
  <div v-if="value !== 0">{{ value }}</div>
  <v-tag v-else class="control" disabled>
    <span class="has-text-dark">N/A</span>
  </v-tag>
</template>


