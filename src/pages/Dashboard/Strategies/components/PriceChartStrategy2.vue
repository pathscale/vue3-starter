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

const binanceAskPrice = props.data
  ? props.data
      ?.map((item) => ({
        x: item.datetime,
        y: item.binanceAskPrice,
      }))
      .sort((a, b) => a.x - b.x)
  : [];

const hyperBidPrice = props.data
  ? props.data
      ?.map((item) => ({
        x: item.datetime,
        y: item.hyperBidPrice,
      }))
      .sort((a, b) => a.x - b.x)
  : [];

const binanceBidPrice = props.data
  ? props.data
      ?.map((item) => ({
        x: item.datetime,
        y: item.binanceBidPrice,
      }))
      .sort((a, b) => a.x - b.x)
  : [];

const hyperAskPrice = props.data
  ? props.data
      ?.map((item) => ({
        x: item.datetime,
        y: item.hyperAskPrice,
      }))
      .sort((a, b) => a.x - b.x)
  : [];

const data = computed(() => {
  const datasets = [
    {
      label: "Binance Ask Price",
      borderColor: "#F3BA2F",
      data: binanceAskPrice,
      pointRadius: 0,
      showLine: true,
      borderWidth: 2,
      key: "binanceAskPrice",
    },
    {
      label: "Hyper Bid Price",
      borderColor: "#51d2c1",
      data: hyperBidPrice,
      pointRadius: 0,
      showLine: true,
      borderWidth: 2,
      key: "hyperBidPrice",
    },
  ];

  const otherDatasets = [
    {
      label: "Binance Bid Price",
      borderColor: "#7F00FF",
      data: binanceBidPrice,
      pointRadius: 0,
      showLine: true,
      borderWidth: 2,
      key: "binanceBidPrice",
    },
    {
      label: "Hyper Ask Price",
      borderColor: "#2E8B57",
      data: hyperAskPrice,
      pointRadius: 0,
      showLine: true,
      borderWidth: 2,
      key: "hyperAskPrice",
    },
  ];

  return { datasets: [...datasets, ...otherDatasets] };
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
