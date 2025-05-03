<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { useRoute } from "vue-router";
import { useUserGetSymbolList } from "~/queries/user";

const props = defineProps<{
  filter: {
    strategyId: number;
    symbol: string;
    id?: number;
    clientId?: string;
    orderId?: number;
    eventId?: number;
  };
  showEventId?: boolean;
  showClientId?: boolean;
  showOrderId?: boolean;
}>();

const route = useRoute();
const strategyId = computed(() =>
  Number.parseInt((route.params.strategyId as string) || "0"),
);

const { data: symbols } = useUserGetSymbolList({
  strategyId: strategyId.value,
});

const filter = reactive(props.filter);

const emit = defineEmits(["update:filter"]);

watch(filter, (newValue) => {
  emit("update:filter", newValue);
});
</script>

<template>
  <v-columns>
    <v-column size="is-3">
      <v-field label="Symbol">
        <input type="text" v-model="filter.symbol" class="input" placeholder="Enter symbol" />
      </v-field>
    </v-column>
    <v-column size="is-3" v-if="showEventId">
      <v-field label="Event ID">
        <input type="number" v-model="filter.eventId" class="input" placeholder="Event ID" />
      </v-field>
    </v-column>
    <v-column size="is-3" v-if="showClientId">
      <v-field label="Client ID">
        <input type="number" v-model="filter.clientId" class="input" placeholder="Client ID" />
      </v-field>
    </v-column>
    <v-column size="is-3" v-if="showOrderId">
      <v-field label="Order ID">
        <input type="number" v-model="filter.orderId" class="input" placeholder="Order ID" />
      </v-field>
    </v-column>
  </v-columns>
</template>
