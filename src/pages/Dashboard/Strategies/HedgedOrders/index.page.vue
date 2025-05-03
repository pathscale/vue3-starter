<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useUserGetHedgedOrders } from "~/queries/user";
import HedgedOrdersTable from "./components/HedgedOrdersTable.vue";

const route = useRoute();
const strategyId = computed(() =>
  Number.parseInt((route.params.strategyId as string) || "0"),
);

const query = computed(() => ({
  strategyId: strategyId.value,
}));

const { data, isPending, isError, error } = useUserGetHedgedOrders(query);
</script>

<template>
  <hedged-orders-table :data="data" :is-pending="isPending" :is-error="isError" :error="error"
    :strategy-id="strategyId" />
</template>
