<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useUserGetLivePosition } from "~/queries/user";
import LivePositionTable from "./components/LivePositionTable.vue";

const route = useRoute();
const strategyId = computed(() =>
  Number.parseInt((route.params.strategyId as string) || "0"),
);

const query = computed(() => ({
  strategyId: strategyId.value,
}));

const { data, isPending, isError, error } = useUserGetLivePosition(query);
</script>

<template>
  <live-position-table :data="data || {
    data: []
  }" :is-pending="isPending" :is-error="isError" :error="error" :strategy-id="strategyId" />
</template>
