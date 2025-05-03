<script setup lang="ts">
import { useTable } from "~/hooks";
import { useUserGetLivePositions } from "~/queries/user";
import { formatTimestamp } from "~/utils/formatters";

const TABLE_COLUMNS = [
  { key: "timestamp", label: "Timestamp", type: "number" },
  { key: "strategy", label: "Strategy", type: "number" },
  { key: "exchange", label: "Exchange", type: "string" },
  { key: "symbol", label: "Symbol", type: "string" },
  { key: "entryPrice", label: "Entry Price", type: "number" },
  { key: "size", label: "Size", type: "number" },
  { key: "entryUsdPrice", label: "Entry USD Price", type: "number" },
  { key: "currentUsdPrice", label: "Current USD Price", type: "number" },
];

const { data, isPending, isError, error } = useUserGetLivePositions();
const datagrid = useTable(data, "data", TABLE_COLUMNS);
</script>

<template>
  <c-table :data="datagrid" :loading="isPending" :is-error="isError" :error-message="error">
    <template #timestamp="scope">
      {{ formatTimestamp(scope.row.timestamp) }}
    </template>
  </c-table>
</template>
