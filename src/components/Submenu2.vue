<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { SUBPAGES } from "~/constants/strategies";

const route = useRoute();
const strategyId = computed(() =>
  Number.parseInt((route.params.strategyId as string) || "2"),
);

const isActiveSubpage = (subpage: string) => {
  return route.path.includes(subpage);
};
</script>

<template>
  <div class="submenu2">
    <nav class="tabs has-text-weight-medium ">
      <ul class="ul">
        <li v-for="subpage in SUBPAGES" :key="subpage.route" :class="{ 'is-active': isActiveSubpage(subpage.route) }">
          <router-link :to="`/strategies/${strategyId}/${subpage.route}`" v-if="subpage.show.includes(strategyId)">
            {{ subpage.text }}
          </router-link>
        </li>
      </ul>
    </nav>
  </div>

</template>
