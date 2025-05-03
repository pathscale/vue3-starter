<script setup lang="ts">
import { onMounted, reactive } from "vue";
import config from "~/config";
import { $toast } from "~/main";
import {
  updateStrategyDataUpdate,
  useStrategyDataUpdate,
} from "~/queries/user";
import { formatTimestamp } from "~/utils/formatters";
import BalancesTable from "./components/BalancesTable.vue";
import OrderUpdatesTable from "./components/OrderUpdatesTable.vue";
import PositionsTable from "./components/PositionsTable.vue";

onMounted(() => {
  const socket = new WebSocket(config.cefiServer);
  socket.onopen = (event) => {
    $toast.success("Connected to Cefi!");
  };
  socket.onmessage = (event) => {
    updateStrategyDataUpdate(JSON.parse(event.data));
  };
  socket.onerror = (error) => {
    $toast.error("Error connecting to Cefi!");
  };
  socket.onclose = (event) => {
    $toast.error("Disconnected from Cefi!");
  };
});

const { data } = useStrategyDataUpdate();
</script>

<template>
  <div>
    <div class="level" v-if="data?.lastUpdatedAt">
      Last Update at: {{ formatTimestamp(data?.lastUpdatedAt) }}
    </div>
    <balances-table />
    <positions-table />
    <order-updates-table />
  </div>
</template>
