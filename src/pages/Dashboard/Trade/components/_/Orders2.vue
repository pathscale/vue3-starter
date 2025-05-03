<script lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from "vue";
import { useTable } from "~/hooks";
import {
  unsubscribeUserSubLiveOrders,
  useUserSubLiveOrders,
} from "~/queries/user";
import { formatTimestamp } from "~/utils/formatters";

// const TABLE_COLUMNS = [
//   {key: 'id', label: 'ID', type: 'number'},
//   {key: 'exchange', label: 'Exchange', type: 'string'},
//   {key: 'symbol', label: 'Symbol', type: 'string'},
//   {key: 'side', label: 'Side', type: 'number'},
//   {key: 'price', label: 'Price', type: 'number'},
//   {key: 'size', label: 'Size', type: 'number'},
//   {key: 'volume', label: 'Volume', type: 'number'},
//   {key: 'orderType', label: 'Order Type', type: 'string'},
//   {key: 'effect', label: 'Position Effect', type: 'string'},
//   {key: 'status', label: 'Status', type: 'string'},
//   {key: 'datetime', label: 'Date Time', type: 'number'}
// ]
//
// const query = reactive({
//   unsubscribe: false
// })
//
// // const { data, isPending, isError, error } = useUserSubLiveOrders(query)
// const {data, isPending, isError, error} = {
//   data: ref({
//     data: [
//       {
//         id: 1,
//         exchange: 'exchange',
//         symbol: 'symbol',
//         side: 1,
//         price: 1,
//         size: 1,
//         volume: 1,
//         orderType: 'orderType',
//         effect: 'effect',
//         status: 'status',
//         datetime: 1
//       }
//     ]
//   }),
//   isPending: false,
//   isError: false,
//   error: undefined
// }
// const datagrid = useTable(data, 'data', TABLE_COLUMNS)
// onBeforeUnmount(() => {
//   unsubscribeUserSubLiveOrders()
// })
//

export default {
  name: "Orders",
  props: {
    // open: {
    //   type: Array as () => Order[],
    //   required: true,
    //   default: () => [],
    // },
    // history: {
    //   type: Array as () => HistoryOrder[],
    //   required: true,
    //   default: () => [],
    // },
    // inactive: {
    //   type: Array as () => HistoryOrder[],
    //   required: true,
    //   default: () => [],
    // },
    // pair: {
    //   type: Object as () => TradingSymbol,
    // },
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
  <c-table :data="datagrid" :loading="isPending" :is-error="isError" :error-message="error">
    <template #datetime="scope">
      {{ formatTimestamp(scope.row.datetime) }}
    </template>
  </c-table>
</template>
