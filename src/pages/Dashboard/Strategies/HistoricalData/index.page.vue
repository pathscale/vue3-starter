<script lang="ts" setup>
import { computed, reactive } from "vue";
import { useRoute } from "vue-router";
import { SymbolFilter } from "~/components";
import { useUserGetStrategyData } from "~/queries/user";
import BasisPointsDifferenceChart from "../components/BasisPointsDifferenceChart.vue";
import HyperDifferenceChartStrategy2 from "../components/HyperDifferenceChartStrategy2.vue";
import PriceChart from "../components/PriceChart.vue";
import PriceChartStrategy2 from "../components/PriceChartStrategy2.vue";
import PriceDifferenceChart from "../components/PriceDifferenceChart.vue";
const route = useRoute();
const strategyId = computed(() =>
  Number.parseInt((route.params.strategyId as string) || "0"),
);

const filter = reactive({
  strategyId: strategyId.value,
  symbol: "",
  timeStart: undefined,
  timeEnd: undefined,
});

const params = computed(() => ({
  strategyId: filter.strategyId,
  symbol: filter.symbol,
  timeStart: filter.timeStart
    ? new Date(filter.timeStart).getTime().toString()
    : undefined,
  timeEnd: filter.timeEnd
    ? new Date(filter.timeEnd).getTime().toString()
    : undefined,
}));

const options = computed(() => ({ enabled: !!filter.symbol }));

const {
  data: strategyData,
  isSuccess,
  isLoading,
} = useUserGetStrategyData(params, options);
</script>

<template>
  <symbol-filter v-model:filter="filter" />
  <v-columns>
    <v-column size="is-8">
      <loader :loading="isLoading" />
      <template v-if="isSuccess">
        <template v-if="strategyId === 2">
          <price-chart-strategy2 :data="strategyData" v-if="strategyData" :key="filter.symbol" />
          <hyper-difference-chart-strategy2 :data="strategyData" v-if="strategyData" :key="filter.symbol" />
        </template>
        <template v-else>
          <price-chart :data="strategyData" v-if="strategyData" :key="filter.symbol" />
          <hr />
          <price-difference-chart :data="strategyData" v-if="strategyData" :key="filter.symbol" />
          <hr />
          <basis-points-difference-chart :data="strategyData" v-if="strategyData" :key="filter.symbol" />
        </template>
      </template>
    </v-column>
  </v-columns>
</template>
