<script lang="ts" setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useUserListS4Jobs } from "~/queries/user/useUserListS4Jobs";
import JobsTable from "./components/JobsTable.vue";

const route = useRoute();
const strategyId = computed(() =>
  Number.parseInt((route.params.strategyId as string) || "0"),
);

const { data, isPending, isError, error } = useUserListS4Jobs();

const showAddJobModal = ref(false);
</script>

<template>
    <div class="space-y-4">
        <div class="is-flex is-justify-content-space-between is-align-items-center">
            <h1 class="title">Jobs</h1>
        </div>

        <jobs-table :data="data || { data: [] }" :is-pending="isPending" :is-error="isError" :error="error"
            :strategy-id="strategyId" />
    </div>
</template>