<script setup lang="ts">
import { computed, defineProps } from "vue";
import { useTable } from "~/hooks";
import { formatTimestamp } from "~/utils/formatters";
import { HEDGED_TABLE_COLUMNS } from "../HedgedOrdersTable.constant";

import type { UserGetHedgedOrdersResponse } from "~/models/user";

interface Props {
  data: {
    orders: UserGetHedgedOrdersResponse["data"];
  };
  strategyId: number;
  isPending: boolean;
  isError: boolean;
  error: any;
}

const props = defineProps<Props>();
const data = computed(() => props.data);
const datagrid = useTable(data, "orders", HEDGED_TABLE_COLUMNS);
</script>

<template>
  <c-table :data="datagrid" :loading="isPending" :is-error="isError" :error-message="error">
    <template #datetime="scope">
      {{ formatTimestamp(scope.row.datetime) }}
    </template>
  </c-table>
</template>
