<script setup lang="ts">
import { computed, ref } from "vue";
import { useValidation } from "vue-composable";
import { formatCamelCase } from "~/utils/formatters";
import { useErrorMessage, useGreaterThan } from "~/utils/validators";

interface Props {
  symbol: string;
}

const props = defineProps<Props>();

const ACTIONS = ["buy", "sell"];
const TYPES = ["market", "limit", "stop"];
const actionTab = ref(0);
const typeTab = ref(0);

const form = useValidation({
  amount: useGreaterThan(0, 0, true),
  timeInForce: {
    $value: ref("goodTillCanceled"),
  },
});

const orderDetails = computed(() => [
  {
    label: "Estimated Market Price",
    value: 0,
  },
  {
    label: "Fees",
    value: 0,
  },
  {
    label: "Order Total",
    value: 0,
  },
  {
    label: "Net",
    value: 0,
  },
]);

const errorMessage = useErrorMessage(form);

const onSubmit = () => {
  alert("Submit Order");
};
</script>

<template>
  <v-tabs v-model="actionTab" expanded>
    <v-tab :label="formatCamelCase(action)" v-for="action in ACTIONS" :key="action">
      <v-tabs v-model="typeTab" expanded>
        <v-tab :label="formatCamelCase(actionType)" v-for="actionType in TYPES" :key="actionType">
          <form @submit.prevent="onSubmit" class="p-5">
            <v-field :message="errorMessage('amount')" type="is-danger" :label="`${formatCamelCase(action)} Amount`">
              <v-input name="amount" v-model.number="form.amount.$value" @wheel="$event.target.blur()" min="0">
                <template #leftIcon>
                  $
                </template>
              </v-input>
            </v-field>
            <v-field label="Time in Force">
              <v-select v-model="form.timeInForce.$value" expanded>
                <option value="goodTillCanceled">{{ formatCamelCase('goodTillCanceled') }}</option>
              </v-select>
            </v-field>
            <hr />
            <v-columns v-for="row in orderDetails" :key="row.label" class="mb-0">
              <v-column>
                <span class="has-text-weight-bold">{{ row.label }}</span>
              </v-column>
              <v-column class="has-text-right">
                <span>{{ row.value?.toFixed(5) }}</span>
              </v-column>
            </v-columns>
            <hr />
            <v-button expanded class="is-capitalized" type="is-primary" native-type="submit"
              :disabled="form.$anyInvalid">
              Place {{ action }} Order
            </v-button>
          </form>
        </v-tab>
      </v-tabs>
    </v-tab>
  </v-tabs>
</template>
