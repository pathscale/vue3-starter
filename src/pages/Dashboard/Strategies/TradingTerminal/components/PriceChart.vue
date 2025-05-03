<script lang="ts" setup>
import Vue3ChartJs from "@pathscale/vue3-chartjs";
import { ref, toRaw, watchEffect } from "vue";
import { useRoute } from "vue-router";

import type { SubS3TerminalBestAskBestBidResponse } from "~/models/user";

interface Props {
  data: SubS3TerminalBestAskBestBidResponse["data"];
  realtime?: boolean;
}

const props = defineProps<Props>();

const chartRef = ref(null);

const formattedData = props.data
  ? props.data
      ?.map((item) => ({ x: item.datetime, y: item.price }))
      .sort((a, b) => a.x - b.x)
  : [];

const data = {
  datasets: [
    {
      label: "Price USD",
      borderColor: "#5183d2",
      data: formattedData,
      pointRadius: 0,
      showLine: true,
      borderWidth: 2,
      lineTension: 0.2,
    },
  ],
};

watchEffect(() => {
  if (props.data.length && props.realtime) {
    chartRef.value?.data.datasets.forEach((dataset: any, i: number) => {
      const newData = props.data.map((item: any) => ({
        x: item.datetime,
        y: item.price,
      }));
      dataset.data = dataset.data
        .concat(newData)
        .sort((a, b) => a.x - b.x)
        .slice(-60);
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
        display: false,
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
