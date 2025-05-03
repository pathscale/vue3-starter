<script lang="ts" setup>
import Vue3ChartJs from "@pathscale/vue3-chartjs";
import { ref, watchEffect } from "vue";

interface DataItem {
  durationMs: number;
  functionName: string;
}

interface Props {
  data: DataItem;
  realtime?: boolean;
  datetime: number;
}

const props = defineProps<Props>();
const chartRef = ref(null);

const formattedData = {
  [props.data.functionName]: [{ x: Date.now(), y: props.data.durationMs }],
};

const datasets = Object.keys(formattedData).map((functionName) => ({
  label: functionName,
  borderColor: `hsl(${functionName.length * 50}, 70%, 50%)`,
  data: formattedData[functionName],
  pointRadius: 0,
  showLine: true,
  borderWidth: 2,
}));

const data = {
  datasets: datasets,
};

watchEffect(() => {
  if (props.data && props.realtime) {
    chartRef.value?.data.datasets.forEach((dataset: any) => {
      const newData = [
        {
          x: props.datetime,
          y: props.data.durationMs,
        },
      ];
      dataset.data = dataset.data
        .concat(newData)
        .sort((a: { x: number }, b: { x: number }) => a.x - b.x)
        .slice(-20);
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
          text: "Duration (ms)",
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  },
};
</script>

<template>
    <vue3-chart-js :type="config.type" :data="config.data" :options="config.options" ref="chartRef"
        style="height: 200px; width: 100%;" />
</template>