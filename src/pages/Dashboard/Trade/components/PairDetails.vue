<script setup lang="ts">
import {
  computed,
  defineEmits,
  defineProps,
  ref,
  watch,
  watchEffect,
} from "vue";

import type { UserListTradingSymbolsResponse } from "~/models/user";

const props = defineProps<{
  pair: UserListTradingSymbolsResponse["data"][0] | undefined;
  items: UserListTradingSymbolsResponse["data"] | undefined;
  loading: boolean;
  defaultPair: string;
}>();

const emit = defineEmits(["update:pair"]);

const currentPair = ref(props.pair);

watch(
  () => props.pair,
  (newValue) => {
    currentPair.value = newValue;
  },
);

watchEffect(() => {
  emit("update:pair", currentPair.value);
});
</script>


<template>
  <v-columns mobile multiline>
    <v-column>
      <v-field label="Choose Pair">
        <v-select v-model="currentPair" :loading="loading" :placeholder="defaultPair || 'Select your option'">
          <option :value="undefined" disabled selected>Select your option</option>
          <option v-for="item in items" :key="item.symbol" :value="item">{{ item.symbol }}</option>
        </v-select>
      </v-field>
    </v-column>
  </v-columns>
</template>
