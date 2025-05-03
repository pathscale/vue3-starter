<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import type {
  SubS3TerminalBestAskBestBidParams,
  UserListTradingSymbolsResponse,
} from "~/models/user";
import {
  unsubscribeSubS3TerminalBestAskBestBid,
  unsubscribeUserSubStrategy3PositionsClosing,
  unsubscribeUserSubStrategy3PositionsOpening,
  useSubS3TerminalBestAskBestBid,
  useUserGetStrategyEvent,
  useUserGetSymbolList,
  useUserListTradingSymbols,
  useUserSubStrategy3PositionsClosing,
  useUserSubStrategy3PositionsOpening,
} from "~/queries/user";
import PairDetails from "../../Trade/components/PairDetails.vue";
import EventsTable from "../Events/components/EventsTable.vue";
import PositionsTable from "./components/PositionsTable.vue";
import PriceChart from "./components/PriceChart.vue";

const route = useRoute();
const strategyId = computed(() =>
  Number.parseInt((route.params.strategyId as string) || "0"),
);
const pair = route.query.pair as string;

const priceQuery = reactive<SubS3TerminalBestAskBestBidParams>({
  symbol: pair as string,
});

const filter = reactive({
  id: undefined,
  strategyId: strategyId.value,
  symbol: "",
  timeStart: undefined,
  timeEnd: undefined,
});
const currentPair = ref<UserListTradingSymbolsResponse["data"][0] | undefined>(
  undefined,
);
const { data: tradingSymbols, isLoading: isLoadingTradingSymbols } =
  useUserListTradingSymbols();
const { data: symbols } = useUserGetSymbolList({
  strategyId: strategyId.value,
});

const { data: price } = useSubS3TerminalBestAskBestBid(priceQuery);
const computedQuery = computed(() => ({
  strategyId: filter.strategyId,
  symbol: filter.symbol || undefined,
  timeStart: filter.timeStart
    ? new Date(filter.timeStart).getTime().toString()
    : undefined,
  timeEnd: filter.timeEnd ? new Date(filter.timeEnd).toString() : undefined,
  id: filter.id || undefined,
}));

const {
  data: events,
  isPending,
  isError,
  error,
} = useUserGetStrategyEvent(computedQuery);

const {
  data: closingData,
  isPending: closingIsPending,
  isError: closingIsError,
  error: closingError,
} = useUserSubStrategy3PositionsClosing();
const {
  data: openingData,
  isPending: openingIsPending,
  isError: openingIsError,
  error: openingError,
} = useUserSubStrategy3PositionsOpening();

onBeforeUnmount(() => {
  unsubscribeUserSubStrategy3PositionsClosing();
  unsubscribeUserSubStrategy3PositionsOpening();
});

onBeforeUnmount(() => {
  unsubscribeSubS3TerminalBestAskBestBid(priceQuery);
});

watch(
  () => currentPair.value?.symbol,
  (newValue, oldValue) => {
    if (newValue !== oldValue && newValue !== pair) {
      const queryParams = new URLSearchParams(window.location.search);
      queryParams.set("pair", newValue!);
      window.location.search = queryParams.toString();
    }
  },
);
</script>

<template>
  <v-columns>
    <v-column size="is-5">
      <pair-details v-model:pair="currentPair" :items="tradingSymbols" :loading="isLoadingTradingSymbols"
        :default-pair="pair" />
      <div v-if="pair">
        <price-chart :data="price.data" v-if="price" :realtime="!!price?.lastUpdatedAt" :key="currentPair?.symbol" />
      </div>
      <div v-else>
        <h1 class="title">
          Select a pair
        </h1>
      </div>

    </v-column>

    <v-column size="is-7">
      <v-columns>
        <v-column size="is-6">
          <div class="subtitle">Opening Positions</div>
          <positions-table :data="openingData" :is-pending="openingIsPending" :is-error="openingIsError"
            :error="openingError" :showCancelOrClose="true" />
        </v-column>
        <v-column size="is-6">
          <div class="subtitle">Closing Positions</div>
          <positions-table :data="closingData" :is-pending="closingIsPending" :is-error="closingIsError"
            :error="closingError" :showCancelOrClose="false" />
        </v-column>
      </v-columns>
    </v-column>
  </v-columns>
  <v-columns>
    <v-column size="is-8">
      <v-columns>
        <v-column>
          <v-field label="Choose Symbol">
            <v-select v-model="filter.symbol" color="is-info" placeholder="Info" size="is-normal">
              <option value="" selected>All symbols</option>
              <option :value="item.symbol" v-for="(item, index) in  symbols" :disabled="!item.flag" :key="index">
                {{ item.symbol }}
              </option>
            </v-select>
          </v-field>
        </v-column>
        <v-column>
          <v-field label="Start Date">
            <input type="date" v-model="filter.timeStart" class="input" />
          </v-field>
        </v-column>
        <v-column>
          <v-field label="End Date">
            <input type="date" v-model="filter.timeEnd" class="input" />
          </v-field>
        </v-column>
        <v-column>
          <v-field label="Event ID">
            <input type="number" v-model="filter.id" class="input" />
          </v-field>
        </v-column>
      </v-columns>
    </v-column>
  </v-columns>

  <v-columns>
    <v-column size="is-12">
      <events-table :data="events" :is-pending="isPending" :is-error="isError" :error="error"
        :strategy-id="strategyId" />
    </v-column>
  </v-columns>
</template>
