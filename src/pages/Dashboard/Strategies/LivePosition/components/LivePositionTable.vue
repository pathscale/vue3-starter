<script setup lang="ts">
import { computed, defineProps, reactive } from "vue";
import { useTable } from "~/hooks";
import {
  formatNumber,
  formatTimestamp,
  stringToHexColor,
} from "~/utils/formatters";
import {
  STRATEGY_1_LIVE_POSITION_TABLE_COLUMNS,
  STRATEGY_2_LIVE_POSITION_TABLE_COLUMNS,
} from "../LivePositionTable.constant";

import { $toast } from "~/main";
import type {
  UserGetLedgerResponse,
  UserGetLivePosition1Response,
  UserGetS2LivePositionResponse,
  UserGetStrategyLivePositionResponse,
} from "~/models/user";
import { useUserCancelOrClosePosition } from "~/mutations";
import type { RecordType } from "~/types";

interface Props {
  data: {
    data:
      | UserGetLivePosition1Response["data"]
      | UserGetS2LivePositionResponse["data"]
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
  1: STRATEGY_1_LIVE_POSITION_TABLE_COLUMNS,
  2: STRATEGY_2_LIVE_POSITION_TABLE_COLUMNS,
  3: STRATEGY_2_LIVE_POSITION_TABLE_COLUMNS,
  4: STRATEGY_2_LIVE_POSITION_TABLE_COLUMNS,
};

const currentColumns = computed(
  () => columns[props.strategyId as keyof typeof columns],
);
const datagrid = useTable(data, "data", currentColumns.value);

const isCanceling = reactive<RecordType>({});
const userCancelOrClosePosition = useUserCancelOrClosePosition();

const onCancel = async (
  row: UserGetStrategyLivePositionResponse["data"][0],
) => {
  try {
    isCanceling[row.id] = true;
    await userCancelOrClosePosition.mutateAsync({
      triggerEventId: row.id,
      strategyId: props.strategyId,
    });
  } catch (error: any) {
    $toast.error(error?.message);
  } finally {
    isCanceling[row.id] = false;
  }
};
</script>

<template>
  <c-table :data="datagrid" :loading="isPending" :is-error="isError" :error-message="error">
    <template #header>
      <div class="pt-6"></div>
    </template>
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

    <template #actions="scope">
      <div style="width: 150px;">
        <v-tooltip type="is-dark" multilined size="is-small"
          label="This will start to close the position in a way that balances losses or captures profits.">
          <v-button type='is-warning' class="is-capitalized" @click="onCancel(scope.row)"
            :loading="isCanceling[scope.row.id]">
            Soft Close
          </v-button>
        </v-tooltip>
      </div>
    </template>
  </c-table>
</template>
