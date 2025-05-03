<script setup lang="ts">
import { computed, defineProps } from "vue";
import { useTable } from "~/hooks";
import { formatTimestamp } from "~/utils/formatters";
import { SPREAD_MEAN_TABLE_COLUMNS } from "../SpreadMeanTable.constant";

import type { UserGet5MinSpreadMeanResponse } from "~/models/user";

interface Props {
  data: {
    data: UserGet5MinSpreadMeanResponse["data"];
  };
  strategyId: number;
  isPending: boolean;
  isError: boolean;
  error: any;
}

const props = defineProps<Props>();
const data = computed(() => props.data);
const datagrid = useTable(data, "data", SPREAD_MEAN_TABLE_COLUMNS);
</script>

<template>
  <c-table :data="datagrid" :loading="isPending" :is-error="isError" :error-message="error">
    <template #datetime="scope">
      {{ formatTimestamp(scope.row.datetime) }}
    </template>
  </c-table>
</template>
