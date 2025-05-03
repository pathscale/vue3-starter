<script setup lang="ts">
import { computed, defineProps } from "vue";
import { useTable } from "~/hooks";
import {
  formatNumber,
  formatTimestamp,
  stringToHexColor,
} from "~/utils/formatters";

import type { UserGetDebugEvent1Response } from "~/models/user";
import {
  STRATEGY_1_EVENTS_TABLE_COLUMNS,
  STRATEGY_2_EVENTS_TABLE_COLUMNS,
} from "../EventsDebugTable.constant";

interface Props {
  data: {
    events: UserGetDebugEvent1Response["data"];
  };
  strategyId: number;
  isPending: boolean;
  isError: boolean;
  error: any;
}

const props = defineProps<Props>();
const data = computed(() => props.data);

const columns = {
  1: STRATEGY_1_EVENTS_TABLE_COLUMNS,
  2: STRATEGY_2_EVENTS_TABLE_COLUMNS,
  3: STRATEGY_2_EVENTS_TABLE_COLUMNS,
  4: STRATEGY_2_EVENTS_TABLE_COLUMNS,
};

const currentColumns = computed(
  () => columns[props.strategyId as keyof typeof columns],
);

const datagrid = useTable(data, "events", currentColumns.value);
</script>

<template>
  <c-table :data="datagrid" :loading="isPending" :is-error="isError" :error-message="error">
    <template #[col.key]="scope" v-for="col in currentColumns.filter(e => e.type !== 'custom')">
      <template v-if="col.type === 'number'">
        {{ formatNumber(scope.row[col.key]) }}
      </template>
      <template v-else-if="col.type === 'date'">
        {{ formatTimestamp(scope.row[col.key]) }}
      </template>
      <template v-else-if="col.type === 'tag'">
        <div class="tag" :style="{ background: stringToHexColor(scope.row[col.key]), color: 'white' }">
          {{ scope.row[col.key] }}
        </div>
      </template>
      <template v-else>
        {{ scope.row[col.key] }}
      </template>
    </template>
  </c-table>
</template>
