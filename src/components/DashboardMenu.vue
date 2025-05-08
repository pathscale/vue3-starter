<script lang="ts" setup>
import { useRoute } from "vue-router";
import { useStrategies } from "~/hooks/useStrategies";
import type { RoutesTypeCustom } from "~/router/dashboard.routes";

const route = useRoute();

interface Props {
  menuItems: RoutesTypeCustom[];
}
defineProps<Props>();
const isActivePath = (_route?: string) => {
  return route.matched[route.matched.length - 1].path.includes(
    _route as string,
  );
};

const strategies = useStrategies();
</script>

<template>
  <div class="pt-2">
    <nav class="tabs has-text-weight-medium">
      <ul class="ul">
        <li v-for="(item, index) in menuItems " :key="index" :class="{
          'is-active has-text-weight-bold': isActivePath(item.route?.path),
        }">
          <router-link :to="{ name: item.route?.name, params: { strategyId: strategies[0].id } }">
            <span> {{ item.title }}</span>
          </router-link>
        </li>
      </ul>
    </nav>
  </div>
</template>

<style>
.tabs:not(:last-child) {
  margin-bottom: 0;
}
</style>
