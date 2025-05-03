<script lang="ts" setup>
import { computed } from "vue";

interface Props {
  diffRatioValue: string | number;
}
const props = defineProps<Props>();

const value = computed(() =>
  typeof props.diffRatioValue === "string"
    ? props.diffRatioValue
      ? Number.parseFloat(props.diffRatioValue)
      : 0
    : props.diffRatioValue,
);
const symbol = computed(() => {
  if (value.value > 0) {
    return "+";
  }
  if (value.value < 0) {
    return "";
  }
  return "";
});

const colorClass = computed(() => {
  if (value.value > 0) {
    return "has-text-success";
  }
  if (value.value < 0) {
    return "has-text-danger";
  }
  return "";
});
</script>

<template>
  <div class="has-text-weight-semibold" :class="colorClass">
    {{ symbol }}{{ value }}%
  </div>
</template>
