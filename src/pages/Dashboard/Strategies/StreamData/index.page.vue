<script lang="ts" setup>
import { computed, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { SymbolFilter } from "~/components";
import {
  useUserGetStrategyEvent,
  useUserGetSymbolList,
  useUserSubStrategyData,
} from "~/queries/user";
import EventsTable from "../Events/components/EventsTable.vue";
import BasisPointsDifferenceChart from "../components/BasisPointsDifferenceChart.vue";
import PriceChart from "../components/PriceChart.vue";
const route = useRoute();
const strategyId = computed(() =>
  Number.parseInt((route.params.strategyId as string) || "0"),
);
const symbol = route.query.symbol as string;

const { isLoading: isLoadingSymbols } = useUserGetSymbolList({
  strategyId: strategyId.value,
});

const filter = reactive({
  strategyId: strategyId.value,
  symbol: symbol?.toUpperCase() || "",
  timeStart: undefined,
  timeEnd: undefined,
});

const options = computed(() => ({ enabled: !!filter.symbol }));
const { data: response } = useUserSubStrategyData(filter, options);
const isReloading = ref(false);

const query = computed(() => ({
  strategyId: filter.strategyId,
  symbol: filter.symbol || undefined,
}));

const { data, isPending, isError, error } = useUserGetStrategyEvent(query);

watch(
  () => filter.symbol,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      isReloading.value = true;
      const queryParams = new URLSearchParams(window.location.search);
      queryParams.set("symbol", newValue);
      window.location.search = queryParams.toString();
    }
  },
);
</script>

<template>
  <symbol-filter v-model:filter="filter" />
  <v-columns>
    <v-column size="is-8">
      <loader :loading="isReloading || isLoadingSymbols" />
      <template v-if="response?.data?.length > 0 && !isReloading && filter.symbol">
        <price-chart :data="response?.data" v-if="response?.data" :key="filter.symbol"
          :realtime="!!response?.lastUpdatedAt" />
        <hr />
        <basis-points-difference-chart :data="response?.data" v-if="response?.data" :key="filter.symbol"
          :realtime="!!response?.lastUpdatedAt" />
        <events-table :data="data" :is-pending="isPending" :is-error="isError" :error="error" :strategy-id="strategyId"
          hider-order-column />
      </template>
    </v-column>
  </v-columns>
</template>
