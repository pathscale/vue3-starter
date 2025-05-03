<script setup lang="ts">
import { computed, defineProps } from "vue";
import { useTable } from "~/hooks";
import type {
  UserGetEvent1Response,
  UserGetS2EventResponse,
  UserGetS3EventResponse,
  UserGetS4EventResponse,
} from "~/models/user";
import {
  formatNumber,
  formatTimestamp,
  stringToHexColor,
} from "~/utils/formatters";
import {
  STRATEGY_1_EVENTS_TABLE_COLUMNS,
  STRATEGY_2_EVENTS_TABLE_COLUMNS,
  STRATEGY_3_EVENTS_TABLE_COLUMNS,
  STRATEGY_4_EVENTS_TABLE_COLUMNS,
} from "../EventsTable.constant";

interface Props {
  data: {
    events:
      | UserGetEvent1Response["data"]
      | UserGetS2EventResponse["data"]
      | UserGetS3EventResponse["data"]
      | UserGetS4EventResponse["data"];
  };
  isPending: boolean;
  isError: boolean;
  error: any;
  strategyId: number;
  hiderOrderColumn?: boolean;
}

const props = defineProps<Props>();
const data = computed(() => props.data);

const columns = {
  1: STRATEGY_1_EVENTS_TABLE_COLUMNS,
  2: STRATEGY_2_EVENTS_TABLE_COLUMNS,
  3: STRATEGY_3_EVENTS_TABLE_COLUMNS,
  4: STRATEGY_4_EVENTS_TABLE_COLUMNS,
};

const currentColumns = computed(
  () => columns[props.strategyId as keyof typeof columns],
);

const datagrid = useTable(data, "events", currentColumns.value);
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

    <template #orders="scope">
      <div v-if="scope.row.orders && scope.row.orders.length > 0">
        <router-link v-for="order in scope.row.orders" :key="order"
          :to="`/strategies/${strategyId}/orders?orderId=${order}`">
          {{ order.toString().slice(-4) }},
        </router-link>
      </div>
      <div v-else>
        N/A
      </div>
    </template>


  </c-table>
</template>
