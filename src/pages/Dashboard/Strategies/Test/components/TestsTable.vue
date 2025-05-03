<script setup lang="ts">
import { computed, defineProps } from "vue";
import { useTable } from "~/hooks";
import type { UserGetLiveTestCloseOrder1Response } from "~/models/user";
import { formatTimestamp } from "~/utils/formatters";
import { TESTS_TABLE_COLUMNS } from "../TestsTable.constant";

interface Props {
  data:
    | {
        orders: UserGetLiveTestCloseOrder1Response["data"];
      }
    | undefined;
  isPending: boolean;
  isError: boolean;
  error: any;
}

const props = defineProps<Props>();
const data = computed(() => props.data);

const datagrid = useTable(data, "orders", TESTS_TABLE_COLUMNS);
</script>

<template>
  <c-table :data="datagrid" :loading="isPending" :is-error="isError" :error-message="error">
    <template #datetime="scope">
      {{ formatTimestamp(scope.row.datetime) }}
    </template>
    <template #level="scope">
      <v-tag rounded :type="scope.row.level === 'Critical' ? 'is-danger' : ''"> {{ scope.row.level }} </v-tag>
    </template>
  </c-table>
</template>
