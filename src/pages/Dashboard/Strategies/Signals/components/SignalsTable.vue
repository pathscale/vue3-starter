<script setup lang="ts">
import { computed, defineProps } from "vue";
import { useRoute } from "vue-router";
import { useTable } from "~/hooks";
import {
  formatNumber,
  formatTimestamp,
  stringToHexColor,
} from "~/utils/formatters";
import {
  STRATEGY_1_SIGNALS_TABLE_COLUMNS,
  STRATEGY_2_SIGNALS_TABLE_COLUMNS,
  STRATEGY_3_SIGNALS_TABLE_COLUMNS,
  STRATEGY_4_SIGNALS_TABLE_COLUMNS,
} from "../SignalsTable.constant";

import type {
  UserGetS2SignalResponse,
  UserGetS3SignalResponse,
  UserGetS4SignalResponse,
  UserGetSignal1Response,
} from "~/models/user";

const route = useRoute();
const strategyId = computed(() =>
  Number.parseInt((route.params.strategyId as string) || "0"),
);

interface Props {
  data:
    | UserGetSignal1Response["data"]
    | UserGetS2SignalResponse["data"]
    | UserGetS3SignalResponse["data"]
    | UserGetS4SignalResponse["data"];
  isPending: boolean;
  isError: boolean;
  error: any;
}

const props = defineProps<Props>();
const data = computed(() => {
  return {
    signals: props.data,
  };
});

const columns = {
  1: STRATEGY_1_SIGNALS_TABLE_COLUMNS,
  2: STRATEGY_2_SIGNALS_TABLE_COLUMNS,
  3: STRATEGY_3_SIGNALS_TABLE_COLUMNS,
  4: STRATEGY_4_SIGNALS_TABLE_COLUMNS,
};

const currentColumns = computed(
  () => columns[strategyId.value as keyof typeof columns],
);
const datagrid = useTable(data, "signals", currentColumns.value);
</script>

<template>
  <c-table :data="datagrid" :loading="isPending" :is-error="isError" :error-message="error" sortable>
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
