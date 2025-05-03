<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useUserGetPositions } from "~/queries/user";
import PositionsTable from "./components/PositionsTable.vue";

const route = useRoute();
const strategyId = computed(() =>
  Number.parseInt((route.params.strategyId as string) || "0"),
);

const query = computed(() => ({
  strategyId: strategyId.value,
}));

const { data, isPending, isError, error } = useUserGetPositions(query);
</script>

<template>
  <positions-table :data="data || {
    data: []
  }" :is-pending="isPending" :is-error="isError" :error="error" :strategy-id="strategyId">
  </positions-table>
</template>
