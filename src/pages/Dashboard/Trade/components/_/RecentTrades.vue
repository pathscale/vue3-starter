<script lang="ts">
import type { Aker } from "~/models/Trading.model";
import { RECENT_TRADES_COLUMNS } from "../constants/orders.constant";

export default {
  name: "RecentTrades",
  props: {
    trades: {
      type: Array as () => Array<Aker>,
      required: true,
      default: () => [],
    },
  },
  setup(props) {
    const getPriceClass = (row: Aker) => {
      if (row.side === "buy") {
        return "has-text-success";
      }
      return "has-text-danger";
    };

    return {
      RECENT_TRADES_COLUMNS,
      getPriceClass,
    };
  },
};
</script>

<template>
  <div class="p-2">Recent Trades</div>
  <basic-table :items="trades" :columns="RECENT_TRADES_COLUMNS">
    <template #price="props">
      <p :class="getPriceClass(props.price.row)">{{ props.price.row.price?.toFixed(2) }}</p>
    </template>
  </basic-table>
</template>
