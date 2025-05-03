<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useUserGetSlippage } from "~/queries/user";
import SlippageTable from "./components/SlippageTable.vue";

const route = useRoute();
const strategyId = computed(() =>
  Number.parseInt((route.params.strategyId as string) || "0"),
);

const query = computed(() => ({
  strategyId: strategyId.value,
}));

const { data, isPending, isError, error } = useUserGetSlippage(query);
</script>

<template>
  <slippage-table :data="data || {
    data: []
  }" :is-pending="isPending" :is-error="isError" :error="error" :strategy-id="strategyId">

  </slippage-table>
</template>
