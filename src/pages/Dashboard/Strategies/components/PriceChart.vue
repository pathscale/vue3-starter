<script lang="ts" setup>
import Vue3ChartJs from "@pathscale/vue3-chartjs";
import { computed, ref, watchEffect } from "vue";
import { useRoute } from "vue-router";

interface Props {
  data: {
    datetime: number;
    binancePrice: number;
    hyperBidPrice: number;
    hyperOracle: number;
    hyperMark: number;
    differenceInUsd: number;
    differenceInBasisPoints: number;
  }[];
  realtime?: boolean;
}
const route = useRoute();
const strategyId = computed(() =>
  Number.parseInt((route.params.strategyId as string) || "0"),
);

const props = defineProps<Props>();

const chartRef = ref(null);

const binancePrice = props.data
  ? props.data
      ?.map((item) => ({
        x: item.datetime,
        y: item.binancePrice,
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
const hyperMark = props.data
  ? props.data
      ?.map((item) => ({
        x: item.datetime,
        y: item.hyperMark,
      }))
      .sort((a, b) => a.x - b.x)
  : [];
const hyperOracle = props.data
  ? props.data
      ?.map((item) => ({
        x: item.datetime,
        y: item.hyperOracle,
      }))
      .sort((a, b) => a.x - b.x)
  : [];

const data = computed(() => {
  const datasets = [
    {
      label: "Binance Price",
      borderColor: "#F3BA2F",
      data: binancePrice,
      pointRadius: 0,
      showLine: true,
      borderWidth: 2,
      key: "binancePrice",
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
      label: "Hyper Mark",
      borderColor: "#7F00FF",
      data: hyperMark,
      pointRadius: 0,
      showLine: true,
      borderWidth: 2,
      key: "hyperMark",
    },
    {
      label: "Hyper Oracle",
      borderColor: "#2E8B57",
      data: hyperOracle,
      pointRadius: 0,
      showLine: true,
      borderWidth: 2,
      key: "hyperOracle",
    },
  ];

  if (strategyId.value === 0) {
    return { datasets: [...datasets, ...otherDatasets] };
  }
  return { datasets };
});

watchEffect(() => {
  if (props.data.length && props.realtime) {
    chartRef.value?.data.datasets.forEach((dataset: any, i: number) => {
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
