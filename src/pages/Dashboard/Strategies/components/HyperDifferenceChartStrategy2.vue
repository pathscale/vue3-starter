<script lang="ts" setup>
import Vue3ChartJs from "@pathscale/vue3-chartjs";
import { computed, ref, toRaw, watchEffect } from "vue";
import { useRoute } from "vue-router";

interface Props {
  data: {
    baHb: number;
    bbHa: number;
    binanceAskPrice: number;
    binanceAskVolume: number;
    binanceBidPrice: number;
    binanceBidVolume: number;
    datetime: number;
    hyperAskPrice: number;
    hyperAskVolume: number;
    hyperBidPrice: number;
    hyperBidVolume: number;
  }[];
  realtime?: boolean;
}

const props = defineProps<Props>();

const chartRef = ref(null);

const baHb = props.data
  ? props.data
      ?.map((item) => ({
        x: item.datetime,
        y: item.baHb,
      }))
      .sort((a, b) => a.x - b.x)
  : [];

const bbHa = props.data
  ? props.data
      ?.map((item) => ({
        x: item.datetime,
        y: item.bbHa,
      }))
      .sort((a, b) => a.x - b.x)
  : [];

const data = computed(() => {
  const datasets = [
    {
      label: "Bin Ask Hyper Bid Difference",
      borderColor: "#F3BA2F",
      data: baHb,
      pointRadius: 0,
      showLine: true,
      borderWidth: 2,
      key: "baHb",
    },
    {
      label: "Binance Bid Hyper Ask Difference",
      borderColor: "#51d2c1",
      data: bbHa,
      pointRadius: 0,
      showLine: true,
      borderWidth: 2,
      key: "bbHa",
    },
  ];

  return { datasets };
});

watchEffect(() => {
  if (props.data.length && props.realtime) {
    chartRef.value?.data?.datasets.forEach((dataset: any, i: number) => {
      const newData = props.data.map((item: any) => ({
        x: item.datetime,
        y: item[dataset.key],
      }));
      dataset.data = dataset.data
        .slice(2)
        .concat(newData)
        .sort((a, b) => a.x - b.x);
    });
    chartRef.value?.update("none");
  }
});

const config = {
  id: "line",
  type: "line",
  data: data.value,
  options: {
    scales: {
      x: {
        type: "time",
      },
      y: {
        title: {
          display: true,
          text: "USD",
        },
      },
    },
  },
};
</script>


<template>
  <vue3-chart-js :type="config.type" :data="config.data" :options="config.options" ref="chartRef" />
</template>
