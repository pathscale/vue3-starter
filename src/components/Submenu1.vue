<script lang="ts" setup>
import { useRoute, useRouter } from "vue-router";
import { useStrategies } from "~/hooks/useStrategies";
import { titleCase } from "~/utils/formatters";

const route = useRoute();
const router = useRouter();

const strategies = useStrategies();

const isActiveStrategy = (strategyId: number) => {
  return route.path.includes(`strategies/${strategyId}`);
};

const toBreadCrumbLink = (index: number) => {
  const breadCrumbRoute = route.path.split("/");
  breadCrumbRoute.splice(index + 1);
  router.replace(breadCrumbRoute.join("/"));
};
</script>

<template>


  <v-columns class="m-0 submenu1">
    <v-column class="p-0">
      <nav class="tabs has-text-weight-medium ">
        <ul class="ul">
          <li v-for="(strategy, index) in strategies" :key="index"
            :class="{ 'is-active': isActiveStrategy(strategy.id) }">
            <router-link :to="`/strategies/${strategy.id}`">
              <span> {{ strategy.name }}</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </v-column>
    <v-column narrow class="p-0 is-hidden-touch is-flex is-align-items-center">
      <v-breadcrumb separator="has-succeeds-separator pr-5">
        <template v-for="(segment, index) in route.path.split('/')">
          <v-breadcrumb-item v-if="index === 0" :key="index" tag="router-link" :to="{
            name: 'dashboardHome'
          }
            ">Dashboard</v-breadcrumb-item>
          <v-breadcrumb-item v-else-if="index < route.path.split('/').length - 1"
            :key="index + '.1' && segment !== 'home'" @click="toBreadCrumbLink(index)">{{
              titleCase(segment) }}
          </v-breadcrumb-item>
          <v-breadcrumb-item v-else-if="segment !== 'home'" :key="index + '.2'" class="has-text-weight-bold" active>{{
            titleCase(segment)
          }}</v-breadcrumb-item>
        </template>
      </v-breadcrumb>
    </v-column>
  </v-columns>

</template>

<style>
</style>
