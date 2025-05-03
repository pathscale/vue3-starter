<script setup lang="ts">
import { computed, reactive } from "vue";
import { useRoute } from "vue-router";
import { SymbolFilter } from "~/components";
import { useUserGetLedger } from "~/queries/user";
import LedgerTable from "./components/LedgerTable.vue";

const route = useRoute();
const strategyId = computed(() =>
  Number.parseInt((route.params.strategyId as string) || "0"),
);
const clientId = route.query.clientId as string;

const filter = reactive({
  strategyId: strategyId.value,
  symbol: "",
  timeStart: undefined,
  timeEnd: undefined,
  clientId: clientId || undefined,
});

const query = computed(() => ({
  strategyId: filter.strategyId,
  symbol: filter.symbol || undefined,
  timeStart: filter.timeStart
    ? new Date(filter.timeStart).getTime()
    : undefined,
  timeEnd: filter.timeEnd ? new Date(filter.timeEnd).getTime() : undefined,
  clientId: filter.clientId || undefined,
}));

const { data, isPending, isError, error } = useUserGetLedger(query);
</script>

<template>
  <symbol-filter v-model:filter="filter" show-event-id show-client-id />
  <ledger-table :data="data || {
    orders: []
  }" :is-pending="isPending" :is-error="isError" :error="error" :strategy-id="strategyId" />
</template>
