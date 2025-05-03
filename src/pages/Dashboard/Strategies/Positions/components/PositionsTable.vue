<script setup lang="ts">
import { computed, defineProps } from "vue";
import { useTable } from "~/hooks";
import {
  formatNumber,
  formatTimestamp,
  stringToHexColor,
} from "~/utils/formatters";

import type {
  UserGetPositionResponse,
  UserGetS2PositionResponse,
} from "~/models/user";
import { POSITIONS_TABLE_COLUMNS } from "../PositionsTable.constant";

interface Props {
  data: {
    data: UserGetS2PositionResponse["data"] | UserGetPositionResponse["data"];
  };
  strategyId: number;
  isPending: boolean;
  isError: boolean;
  error: any;
}

const props = defineProps<Props>();
const data = computed(() => props.data);

const columns = {
  2: POSITIONS_TABLE_COLUMNS,
  3: POSITIONS_TABLE_COLUMNS,
};
const currentColumns = computed(
  () => columns[props.strategyId as keyof typeof columns],
);
const datagrid = useTable(data, "data", currentColumns.value);
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

    <template #events="scope">
      <router-link v-for="event in scope.row.events" :to="`/strategies/${props.strategyId}/events?eventId=${event}`">{{
        event
      }},</router-link>
    </template>
  </c-table>
</template>
