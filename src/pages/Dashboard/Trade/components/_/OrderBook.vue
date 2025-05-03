<script lang="ts">
import { computed } from "vue";
import { ORDER_BOOK_COLUMNS } from "../constants/orders.constant";
import type { OrderBookItem } from "../hooks/useOrderBook";

export default {
  name: "OrderBook",
  props: {
    buys: {
      type: Array as () => Array<OrderBookItem>,
      required: true,
      default: () => [],
    },
    sells: {
      type: Array as () => Array<OrderBookItem>,
      required: true,
      default: () => [],
    },
    spreed: {
      type: String as () => string,
      required: true,
      default: "",
    },
  },
  setup(props) {
    const getPriceClass = (row: OrderBookItem) => {
      if (row.type === "buy") {
        return "has-text-success";
      }
      return "has-text-danger";
    };

    return {
      ORDER_BOOK_COLUMNS,
      getPriceClass,
    };
  },
};
</script>

<template>
  <div class="p-2">Order Book</div>
  <div class="v-table has-text-grey-light" loading="false">
    <div class="table-wrapper table-container">
      <table class="table is-hoverable is-fullwidth" style="position: relative;">
        <thead class="thead">
          <tr class="tr">
            <th class="th">Price</th>
            <th class="th">Qty</th>
          </tr>
        </thead>
      </table>
    </div>
  </div>

  <div class="is-flex is-flex-direction-column is-justify-content-center is-flex-1">
    <basic-table :columns="ORDER_BOOK_COLUMNS" :items="sells" class="headless-table">
      <template #price="props">
        <p :class="getPriceClass(props.price.row)">{{ props.price.row.price }}</p>
      </template>
    </basic-table>

    <basic-table :columns="ORDER_BOOK_COLUMNS" :items="buys" class="headless-table">
      <template #header>
        <div class="p-2">Spread {{ spreed }}</div>
      </template>

      <template #price="props">
        <p :class="getPriceClass(props.price.row)">{{ props.price.row.price }}</p>
      </template>
    </basic-table>
  </div>
</template>

<style>
.headless-table .thead {
  display: none;
}
</style>
