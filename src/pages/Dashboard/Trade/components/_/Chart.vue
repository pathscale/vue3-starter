<script lang="ts">
import { ref } from "vue";
import DepthChart from "./DepthChart.vue";
import PriceChart from "./PriceChart.vue";

import store from "~/store/modules/App/trading.module";

export default {
  name: "Chart",
  components: { PriceChart, DepthChart },
  props: {
    symbolId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    const activeTab = ref(0);
    return { activeTab, store };
  },
};
</script>

<template>
  <v-tabs v-model="activeTab" expanded>
    <v-tab label=" Price Chart">
      <div class="py-2 px-2">
        <price-chart :symbol-id="symbolId" />
      </div>
    </v-tab>

    <v-tab label="Depth Chart">
      <div class="py-2 px-2">
        <depth-chart :symbol-id="symbolId" :key="store.depth" />
      </div>
    </v-tab>
  </v-tabs>
</template>
