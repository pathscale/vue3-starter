<script lang="ts" setup>
import { computed, ref } from "vue";
import { useTable } from "~/hooks";
import { useUserGetFundingComparison } from "~/queries/user";
import {
  formatNumber,
  formatTimestamp,
  stringToHexColor,
} from "~/utils/formatters";
import {
  FUNDING_TABLE_COLUMNS,
  FUNDING_TABLE_COLUMNS_TOP,
} from "./FundingComparison.constant";

const {
  data: _data,
  isPending,
  isError,
  error,
} = useUserGetFundingComparison();
const activeTab = ref(0);

const data = computed<any>(() => {
  return {
    data: _data.value?.data.rate,
    top: _data.value?.data.top,
  };
});

const datagrid = useTable(data, "data", FUNDING_TABLE_COLUMNS);
const datagridTop = useTable(data, "top", FUNDING_TABLE_COLUMNS_TOP);
</script>

<template>
  <v-tabs v-model="activeTab">
    <v-tab label="Rate">
      <c-table :data="datagrid" :loading="isPending" :is-error="isError" :error-message="error" sortable>
        <template #[col.key]="scope" v-for="col in FUNDING_TABLE_COLUMNS.filter(e => e.type !== 'custom')"
          :key="col.key">
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
    </v-tab>
    <v-tab label="Top">
      <c-table :data="datagridTop" :loading="isPending" :is-error="isError" :error-message="error" sortable>
        <template #[col.key]="scope" v-for="col in FUNDING_TABLE_COLUMNS_TOP.filter(e => e.type !== 'custom')"
          :key="col.key">
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
    </v-tab>
  </v-tabs>
</template>
