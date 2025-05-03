<script setup lang="ts">
import { useTable } from "~/hooks";
import { useUserGetPerformanceMeasurement } from "~/queries/user";

import PerformanceChart from "./components/PerformanceChart.vue";

const TABLE_COLUMNS = [
  { key: "functionName", label: "Function Name", type: "string" },
  { key: "durationMs", label: "duration (ms)", type: "number" },
];

const { data, isPending, isError, error } = useUserGetPerformanceMeasurement();
const datagrid = useTable(data, "data", TABLE_COLUMNS);
</script>

<template>
  <c-table :data="datagrid" :loading="isPending" :is-error="isError" :error-message="error">
    <template #functionName="scope">
      {{ scope.row.functionName }}
    </template>
  </c-table>
  <v-columns v-if="data" class="mt-3">
    <v-column size="is-8">
      <div v-for="(item, index) in data.data" :key="index" class="mb-5">
        <p class="mb-2">{{ item.functionName }}</p>
        <div class="table ml-3">
          <performance-chart :data="item" :datetime="data.datetime" realtime />
        </div>
      </div>
    </v-column>
  </v-columns>
</template>
