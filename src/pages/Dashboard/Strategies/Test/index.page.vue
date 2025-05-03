<script setup lang="ts">
import { computed, reactive } from "vue";
import { useRoute } from "vue-router";
import { useUserGetLiveTestCloseOrder1 } from "~/queries/user";
import TestsTable from "./components/TestsTable.vue";

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
  id: eventId || undefined,
});

const query = computed(() => ({
  strategyId: filter.strategyId,
  symbol: filter.symbol || undefined,
  timeStart: filter.timeStart
    ? new Date(filter.timeStart).getTime()
    : undefined,
  timeEnd: filter.timeEnd ? new Date(filter.timeEnd).getTime() : undefined,
  id: filter.id || undefined,
}));

const options = computed(() => ({ enabled: query.value.strategyId === 1 }));

const { data, isPending, isError, error } =
  useUserGetLiveTestCloseOrder1(query);
</script>

<template>
  <v-columns>
    <v-column size="is-8">
      <div>
        <v-columns>
          <v-column>
            <v-field label="Start Date">
              <input type="date" v-model="filter.timeStart" class="input" />
            </v-field>
          </v-column>
          <v-column>
            <v-field label="End Date">
              <input type="date" v-model="filter.timeEnd" class="input" />
            </v-field>
          </v-column>
          <v-column>
            <v-field label="Event ID">
              <input type="number" v-model="filter.id" class="input" />
            </v-field>
          </v-column>
        </v-columns>
      </div>
    </v-column>
  </v-columns>

  <tests-table :data="data" :is-pending="isPending" :is-error="isError" :error="error" :strategy-id="strategyId" />
</template>
