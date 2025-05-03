<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useUserGet5MinSpreadMean } from "~/queries/user";
import SpreadMeanTable from "./components/SpreadMeanTable.vue";

const route = useRoute();
const strategyId = computed(() =>
  Number.parseInt((route.params.strategyId as string) || "0"),
);

const query = computed(() => ({
  strategyId: strategyId.value,
}));

const { data, isPending, isError, error } = useUserGet5MinSpreadMean(query);
</script>

<template>
  <spread-mean-table :data="data" :is-pending="isPending" :is-error="isError" :error="error"
    :strategy-id="strategyId" />
</template>
