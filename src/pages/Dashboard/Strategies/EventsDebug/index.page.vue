<script setup lang="ts">
import { computed, reactive } from "vue";
import { useRoute } from "vue-router";
import { SymbolFilter } from "~/components";
import { useUserGetStrategyEvent } from "~/queries/user";
import EventsTable from "./components/EventsDebugTable.vue";

const route = useRoute();
const strategyId = computed(() =>
  Number.parseInt((route.params.strategyId as string) || "0"),
);
const eventId = Number.parseInt(route.query.eventId as string);

const filter = reactive({
  strategyId: strategyId.value,
  symbol: "",
  timeStart: undefined,
  timeEnd: undefined,
  eventId: eventId || undefined,
});

const query = computed(() => ({
  strategyId: filter.strategyId,
  symbol: filter.symbol || undefined,
  timeStart: filter.timeStart
    ? new Date(filter.timeStart).getTime()
    : undefined,
  timeEnd: filter.timeEnd ? new Date(filter.timeEnd).getTime() : undefined,
  eventId: filter.eventId || undefined,
  debug: true,
}));

const { data, isPending, isError, error } = useUserGetStrategyEvent(query);
</script>

<template>
  <symbol-filter v-model:filter="filter" show-event-id />
  <events-table :data="data || { events: [] }" :is-pending="isPending" :is-error="isError" :error="error"
    :strategy-id="strategyId" />
</template>
