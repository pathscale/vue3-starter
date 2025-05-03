<script lang="ts">
import { VDepthChart } from "@pathscale/vue3-ui";
import { computed, ref, toRaw } from "vue";

import store from "~/store/modules/App/trading.module";

export default {
  name: "DepthChart",
  components: { VDepthChart },
  setup() {
    const parentRef = ref(null);

    const options = computed(() => ({
      // @ts-ignore
      width: parentRef.value?.getBoundingClientRect()?.width - 10 || 500,
      height: 420,
      tipType: "axis",
      watermaskType: "image",
      watermaskContent: null,
    }));

    const buys = computed(() => {
      const depth = toRaw(store.depth);
      let bids: [number, number][] = [];
      if (depth && depth.buy_prices.length > 0) {
        depth.buy_prices.forEach((price, index) => {
          bids.push([price, depth.buy_quantities[index]]);
        });
      }

      bids = bids.sort((a, b) => {
        if (a[0] > b[0]) {
          return 1;
        }
        if (a[0] < b[0]) {
          return -1;
        }
        return 0;
      });

      if (bids.length > 1) {
        bids.unshift([bids[0][0] - 1, bids[0][1] + 1]);
      } else {
        bids.push([0, 0]);
      }
      return bids;
    });

    const sells = computed(() => {
      const depth = toRaw(store.depth);
      let asks: [number, number][] = [];
      if (depth && depth.sell_prices.length > 0) {
        depth.sell_prices.forEach((price, index) => {
          asks.push([price, depth.sell_quantities[index]]);
        });
        asks.push([
          depth.sell_prices[depth.sell_prices.length - 1] + 1,
          depth.sell_quantities[depth.sell_quantities.length - 1] + 1,
        ]);
      } else {
        asks.push([0, 0]);
      }

      asks = asks.sort((a, b) => {
        if (a[0] > b[0]) {
          return -1;
        }
        if (a[0] < b[0]) {
          return 1;
        }
        return 0;
      });

      return asks;
    });

    const data = computed(() => {
      let buySum = 0;
      let sellSum = 0;
      return {
        buy: buys.value
          ?.slice(0)
          .reverse()
          .map(([price, amount]) => {
            buySum += Math.round(amount * 100) / 100;
            return { price, amount: buySum };
          }),
        sell: sells.value
          ?.slice(0)
          .reverse()
          .map(([price, amount]) => {
            sellSum += Math.round(amount * 100) / 100;
            return { price, amount: sellSum };
          })
          .reverse(),
      };
    });

    return {
      options,
      theme: "day",
      data,
      parentRef,
    };
  },
};
</script>


<template>
  <div ref="parentRef">
    <v-depth-chart :data="data" :customize-options="options" :theme="theme" v-if="parentRef" />
  </div>
</template>
