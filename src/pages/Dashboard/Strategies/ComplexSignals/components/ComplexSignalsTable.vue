<script setup lang="ts">
import { computed, defineProps, reactive } from "vue";
import { useRoute } from "vue-router";
import { usePagination, useTable } from "~/hooks";
import {
  formatNumber,
  formatTimestamp,
  stringToHexColor,
} from "~/utils/formatters";
import { STRATEGY_1_COMPLEX_SIGNALS_TABLE_COLUMNS } from "../ComplexSignalsTable.constant";

import type { UserGetComplexSignal1Response } from "~/models/user";

const route = useRoute();
const strategyId = computed(() =>
  Number.parseInt((route.params.strategyId as string) || "0"),
);

interface Props {
  data: UserGetComplexSignal1Response["data"];
  isPending: boolean;
  isError: boolean;
  error: any;
}

const filterParams = reactive({
  limit: 200,
  offset: 0,
});

const props = defineProps<Props>();

const data = computed(() => {
  return {
    signals:
      props.data?.slice(
        filterParams.offset,
        filterParams.offset + filterParams.limit,
      ) || [],
    total: props.data?.length || 0,
  };
});

const columns = {
  1: STRATEGY_1_COMPLEX_SIGNALS_TABLE_COLUMNS,
};

const currentColumns = computed(
  () => columns[strategyId.value as keyof typeof columns],
);
const datagrid = useTable(data, "signals", currentColumns.value);
const { currentPage } = usePagination(data, "signals", filterParams);
</script>

<template>
  <c-table :data="datagrid" :loading="isPending" :is-error="isError" :error-message="error"
    v-model:current-page="currentPage" :total="data?.total" pagination :per-page="filterParams.limit" sortable>
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
