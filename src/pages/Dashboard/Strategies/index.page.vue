<script lang="ts" setup>
import { computed, watch, watchEffect } from "vue";
import { useRoute } from "vue-router";
import { useStrategies } from "~/hooks/useStrategies";
import { useUserSetStrategyStatus } from "~/mutations";
import { useUserGetStrategyStatus } from "~/queries/user";

const route = useRoute();
const strategyId = computed(() =>
  Number.parseInt((route.params.strategyId as string) || "0"),
);

const { data, isLoading } = useUserGetStrategyStatus();
const userSetStrategyStatus = useUserSetStrategyStatus();

const strategies = useStrategies();

watchEffect(() => {
  if (data?.value) {
    data.value.forEach((e) => {
      const strategy = strategies.find((s) => s.id === e.id);
      if (strategy) {
        strategy.status = e.status;
      }
    });
  }
});

watch(
  () => strategies.map((e) => e.status),
  (value) => {
    if (
      strategies.some(
        (e) =>
          e.status !==
          (data?.value?.find((s) => s.id === e.id)?.status ?? e.status),
      )
    ) {
      userSetStrategyStatus.mutate({
        setStatus: strategies.map((e) => ({
          id: e.id,
          status: e.status || "disabled",
        })),
      });
    }
  },
  { immediate: false },
);

const username = localStorage.getItem("username");
</script>

<template>
  <loader v-if="isLoading" :loading="isLoading" />
  <template v-for="strategy in strategies" :key="strategy.id">
    <article class="message" v-if="strategyId === strategy.id">
      <div class="message-header">
        <p>{{ strategy.name }}</p>

      </div>
      <div class="message-body">
        <v-columns>
          <v-column>
            <div class="content">
              {{ strategy.description }}
            </div>
          </v-column>
          <v-column narrow class="is-flex is-align-items-end">
            <v-field label="Status">
              <v-select v-model="strategy.status" :disabled="username === 'guest'">
                <option value="enabled">Enabled</option>
                <option value="paused">Paused</option>
                <option value="disabled">Disabled</option>
              </v-select>
            </v-field>
          </v-column>
        </v-columns>
      </div>
    </article>
  </template>
</template>
