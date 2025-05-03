<script lang="ts" setup>
import Vue3ChartJs from "@pathscale/vue3-chartjs";
import { ref, watchEffect } from "vue";

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

const props = defineProps<Props>();

const chartRef = ref(null);

const formattedData = props.data
  ? props.data
      ?.map((item) => ({ x: item.datetime, y: item.differenceInBasisPoints }))
      .sort((a, b) => a.x - b.x)
  : [];

const data = {
  datasets: [
    {
      label: "Basis Points Difference",
      borderColor: "#d2518d",
      data: formattedData,
      pointRadius: 0,
      showLine: true,
      borderWidth: 2,
    },
  ],
};

watchEffect(() => {
  if (props.data.length && props.realtime) {
    chartRef.value?.data.datasets.forEach((dataset: any, i: number) => {
      const newData = props.data.map((item: any) => ({
        x: item.datetime,
        y: item.differenceInBasisPoints,
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
  data: data,
  options: {
    scales: {
      x: {
        type: "time",
      },
      y: {
        title: {
          display: true,
          text: "Points",
        },
      },
    },
  },
};
</script>


<template>
  <vue3-chart-js :type="config.type" :data="config.data" :options="config.options" ref="chartRef" />
</template>
