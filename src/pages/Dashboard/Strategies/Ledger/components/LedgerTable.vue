<script setup lang="ts">
import { computed, defineProps } from "vue";
import { useTable } from "~/hooks";
import type {
  UserGetLedgerResponse,
  UserGetS1LedgerResponse,
  UserGetS2LedgerResponse,
} from "~/models/user";
import {
  formatNumber,
  formatTimestamp,
  stringToHexColor,
} from "~/utils/formatters";
import {
  STRATEGY_1_LEDGER_TABLE_COLUMNS,
  STRATEGY_2_LEDGER_TABLE_COLUMNS,
  STRATEGY_3_LEDGER_TABLE_COLUMNS,
} from "../LedgerTable.constant";

interface Props {
  data: {
    orders:
      | UserGetS1LedgerResponse["data"]
      | UserGetS2LedgerResponse["data"]
      | UserGetLedgerResponse["data"];
  };
  isPending: boolean;
  isError: boolean;
  error: any;
  strategyId: number;
}

const props = defineProps<Props>();
const data = computed(() => props.data);

const columns = {
  1: STRATEGY_1_LEDGER_TABLE_COLUMNS,
  2: STRATEGY_2_LEDGER_TABLE_COLUMNS,
  3: STRATEGY_3_LEDGER_TABLE_COLUMNS,
  4: STRATEGY_3_LEDGER_TABLE_COLUMNS,
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

    <template #binanceOpenOrderId="scope">
      <router-link v-for="order in scope.row.binanceOpenOrderId"
        :to="`/strategies/${props.strategyId}/orders?orderId=${order}`">{{
          order
        }},</router-link>
    </template>

    <template #binanceCloseOrderId="scope">
      <router-link v-for="order in scope.row.binanceCloseOrderId"
        :to="`/strategies/${props.strategyId}/orders?orderId=${order}`">{{
          order
        }},</router-link>
    </template>

    <template #hyperOpenOrderId="scope">
      <router-link v-for="order in scope.row.hyperOpenOrderId"
        :to="`/strategies/${props.strategyId}/orders?orderId=${order}`">{{
          order
        }},</router-link>
    </template>

    <template #hyperCloseOrderId="scope">
      <router-link v-for="order in scope.row.hyperCloseOrderId"
        :to="`/strategies/${props.strategyId}/orders?orderId=${order}`">{{
          order
        }},</router-link>
    </template>

  </c-table>
</template>
