<script setup lang="ts">
import { computed, defineProps } from "vue";
import { useTable } from "~/hooks";
import type {
  UserGetLedgerResponse,
  UserGetOrder1Response,
  UserGetS2OrderResponse,
} from "~/models/user";
import {
  formatNumber,
  formatTimestamp,
  stringToHexColor,
} from "~/utils/formatters";
import {
  STRATEGY_1_ORDERS_TABLE_COLUMNS,
  STRATEGY_2_ORDERS_TABLE_COLUMNS,
} from "../OrdersTable.constant";

interface Props {
  data: {
    orders:
      | UserGetOrder1Response["data"]
      | UserGetS2OrderResponse["data"]
      | UserGetLedgerResponse["data"];
  };
  strategyId: number;
  isPending: boolean;
  isError: boolean;
  error: any;
}

const props = defineProps<Props>();
const data = computed(() => props.data);

const columns = {
  1: STRATEGY_1_ORDERS_TABLE_COLUMNS,
  2: STRATEGY_2_ORDERS_TABLE_COLUMNS,
  3: STRATEGY_2_ORDERS_TABLE_COLUMNS,
  4: STRATEGY_2_ORDERS_TABLE_COLUMNS,
};

const currentColumns = computed(
  () => columns[props.strategyId as keyof typeof columns],
);

const datagrid = useTable(data, "orders", currentColumns.value);
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

    <template #triggerEventId="scope">
      <router-link :to="`/strategies/${props.strategyId}/events?eventId=${scope.row.triggerEventId}`">{{
        scope.row.triggerEventId
        }}</router-link>
    </template>



    <template #eventId="scope">
      <router-link :to="`/strategies/${props.strategyId}/events?eventId=${scope.row.eventId}`">{{ scope.row.eventId
        }}</router-link>
    </template>

  </c-table>
</template>
