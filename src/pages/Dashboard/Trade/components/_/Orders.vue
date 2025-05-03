<script lang="ts">
import { computed, ref } from "vue";
import type { HistoryOrder, Order } from "~/models/Trading.model";
import type { TradingSymbol } from "~/store/modules/App/types/instruments.types";
import { ORDER_TABS } from "../constants/orders.constant";

export default {
  name: "Orders",
  props: {
    open: {
      type: Array as () => Order[],
      required: true,
      default: () => [],
    },
    history: {
      type: Array as () => HistoryOrder[],
      required: true,
      default: () => [],
    },
    inactive: {
      type: Array as () => HistoryOrder[],
      required: true,
      default: () => [],
    },
    pair: {
      type: Object as () => TradingSymbol,
    },
  },
  emits: ["cancelOrder"],
  setup(props) {
    const activeTab = ref(0);

    const getSideClass = (row: Order) => {
      if (row.side === "buy") {
        return "has-text-success";
      }
      return "has-text-danger";
    };

    const orders = computed(() => {
      if (activeTab.value === 0) {
        return props.open;
      }
      if (activeTab.value === 1) {
        return props.history;
      }
      return props.inactive;
    });

    return { activeTab, ORDER_TABS, orders, getSideClass };
  },
};
</script>

<template>
  <v-tabs v-model="activeTab" expanded class="mb-0">
    <v-tab v-for="tab in ORDER_TABS" :key="tab.value" :label="tab.label">
      <basic-table bordered :items="orders" :columns="ORDER_TABS[activeTab].columns">
        <template #side="props">
          <span :class="getSideClass(props.side.row)">
            {{ props.side.row.side }}
          </span>
        </template>

        <template #symbolId>{{ pair?.name }} </template>
        <template #action="props">
          <v-button type="is-danger" @click="$emit('cancelOrder', props.action.row)">
            Cancel</v-button>
        </template>
      </basic-table>
    </v-tab>
  </v-tabs>
</template>

<style>
.mb-0>.tabs:not(:last-child) {
  margin-bottom: 0;
}
</style>
