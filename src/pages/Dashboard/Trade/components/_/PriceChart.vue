<script lang="ts">
import { VChart } from "@pathscale/vue3-ui";

import { computed } from "vue";

import store from "~/store/modules/App/trading.module";
import { formatDateHHMMSS } from "~/utils/formatters";

const chartOptions = {
  title: "",
  type: "candle", // or 'bar', 'line', 'pie', 'percentage'
  height: 400,
  axisOptions: {
    xIsSeries: true,
    xAxisMode: "tick",
  },
  lineOptions: {
    regionFill: 1, // default: 0
    spline: 1,
    hideDots: 1,
  },
  tooltipOptions: {
    formatTooltipX: (d) => `${d}`.toUpperCase(),
    formatTooltipY: (d) => `${d} pts`,
  },
  candleOptions: {
    spaceRatio: 0.5,
  },
  colors: ["#26a69a", "#ef5350"],
};

export default {
  name: "PriceChart",
  components: { VChart },
  props: {
    symbolId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const data = computed(() => {
      const labels: string[] = [];
      store.kline5s[props.symbolId]?.forEach((price, i) => {
        labels.push(formatDateHHMMSS(price.open_time));
      });

      return {
        labels,
        datasets: [
          {
            name: "Price",
            values: store.kline5s[props.symbolId]?.map((price) => {
              return [
                price.open_price,
                price.high_price,
                price.low_price,
                price.close_price,
                price.quote_volume,
              ];
            }),
          },
        ],
      };
    });

    return {
      chartOptions,
      data,
      store,
    };
  },
};
</script>

<template>
  <v-chart v-if="store.kline5s[symbolId]?.length" v-bind="chartOptions" :data="data" :width="store.kline5sSeq" />
  <div v-else>Data not available, please wait...</div>
</template>
