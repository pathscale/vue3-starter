<script setup lang="ts">
import { computed, reactive } from "vue";
import { useRoute } from "vue-router";
import { SymbolFilter } from "~/components";
import { useUserGetComplexSignal } from "~/queries/user";
import ComplexSignalsTable from "./components/ComplexSignalsTable.vue";
const route = useRoute();
const strategyId = computed(() =>
  Number.parseInt((route.params.strategyId as string) || "0"),
);

const filter = reactive({
  strategyId: strategyId.value,
  symbol: "",
  signal: undefined,
});

const query = computed(() => ({
  strategyId: filter.strategyId,
  symbol: filter.symbol || undefined,
  signal: filter.signal || undefined,
}));

const { data, isPending, isError, error } = useUserGetComplexSignal(query);
</script>

<template>
  <symbol-filter v-model:filter="filter" />
  <complex-signals-table :data="data || []" :is-pending="isPending" :is-error="isError" :error="error"
    :strategy-id="strategyId" />
</template>
