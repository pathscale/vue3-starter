<script setup lang="ts">
import { useTable } from "~/hooks";
import { useStrategyDataUpdate } from "~/queries/user";
import { formatDateMDHIS } from "~/utils/formatters";
import { BALANCES_TABLE_COLUMNS } from "../BalancesTable.constant";
const { data, isPending, isError, error } = useStrategyDataUpdate();
const datagrid = useTable(data, "balances", BALANCES_TABLE_COLUMNS);
</script>


<template>
  <c-table :data="datagrid" :loading="isPending" :is-error="isError" :error-message="error">

    <template #update_lt="scope">
      {{ formatDateMDHIS(scope.row.update_lt) }}
    </template>

    <template #update_est="scope">
      {{ formatDateMDHIS(scope.row.update_est) }}
    </template>

    <template #update_tst="scope">
      {{ formatDateMDHIS(scope.row.update_tst) }}
    </template>


  </c-table>
</template>
