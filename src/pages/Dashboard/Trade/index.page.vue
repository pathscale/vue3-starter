<script setup lang="ts">
import { onBeforeUnmount, reactive, ref, watch } from "vue";
import Order from "./components/Order.vue";
import PairDetails from "./components/PairDetails.vue";

import {
  unsubscribeSubS3TerminalBestAskBestBid,
  useSubS3TerminalBestAskBestBid,
  useUserListTradingSymbols,
} from "~/queries/user";
import PriceChart from "../Strategies/TradingTerminal/components/PriceChart.vue";

import { useRoute } from "vue-router";
import type {
  SubS3TerminalBestAskBestBidParams,
  UserListTradingSymbolsResponse,
} from "~/models/user";

const route = useRoute();
const pair = route.query.pair as string;
const priceQuery = reactive<SubS3TerminalBestAskBestBidParams>({
  symbol: pair as string,
});

const currentPair = ref<UserListTradingSymbolsResponse["data"][0] | undefined>(
  undefined,
);
const { data: tradingSymbols, isLoading: isLoadingTradingSymbols } =
  useUserListTradingSymbols();
const { data: price } = useSubS3TerminalBestAskBestBid(priceQuery);

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
  <div>
    <div class="has-border-bottom-gray pb-5">
      <pair-details v-model:pair="currentPair" :items="tradingSymbols" :loading="isLoadingTradingSymbols"
        :default-pair="pair" />
    </div>
    <v-columns gapless>
      <v-column size="is-10 is-overflow-auto">
        <v-columns gapless class="mb-0">
          <v-column size="is-9" class="has-border-right-gray">
            <price-chart :data="price.data" v-if="price" :realtime="!!price?.lastUpdatedAt"
              :key="currentPair?.symbol" />
          </v-column>
          <v-column size="is-2" class="h-500">
            Recent trades
          </v-column>
        </v-columns>
        <v-columns gapless>
          <v-column>
            <div class="h-200 has-border-top-gray">
              Orders
            </div>
          </v-column>
        </v-columns>
      </v-column>
      <v-column class="is-overflow-auto" size="is-2">
        <div class="has-border-left-gray h-200">
          <Order />
        </div>
      </v-column>
    </v-columns>
  </div>
</template>

<style scoped>
.h-500 {
  height: 500px;
  min-height: 100%;
  overflow-y: auto;
}

.h-200 {
  min-height: 200px;
  height: 100%;
  max-width: calc(100vw - 2rem);
}
</style>
