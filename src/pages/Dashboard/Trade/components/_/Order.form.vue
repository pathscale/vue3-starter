<script lang="ts">
import { computed, ref, toRef, watchEffect } from "vue";
import { useValidation } from "vue-composable";
import type { SubmitOrder } from "~/models/app/request";
import type {
  Price,
  TradingSymbol,
} from "~/store/modules/App/types/instruments.types";
import { formatCamelCase, numberPrecision } from "~/utils/formatters";
import { useErrorMessage, useGreaterThan } from "~/utils/validators";
import useCurrentProducts from "../hooks/useCurrentProducts";

export default {
  name: "OrderForm",
  props: {
    action: {
      type: String as () => "buy" | "sell",
      default: "buy",
    },
    actionType: {
      type: String as () => "market" | "limit" | "stop",
      default: "marketmarket",
    },
    pair: {
      type: Object as () => TradingSymbol,
      required: true,
    },
    symbolStatus: {
      type: Object as () => Price,
    },
    loading: Boolean,
  },
  emits: ["close", "submit"],
  setup(props, { emit }) {
    const { base, quote } = useCurrentProducts(toRef(props, "pair"));

    const form = useValidation({
      amount: useGreaterThan(0, props.pair?.minQuantity, true),
      stopOrLimitPrice: useGreaterThan(
        props.pair?.minPrice,
        ["limit", "stop"].includes(props.actionType) ? 0 : -1,
      ),
      timeInForce: {
        $value: ref("goodTillCanceled"),
      },
    });

    const avgPrice = computed(() => {
      return (
        (props.symbolStatus?.avg_price_30s ||
          props.symbolStatus?.close_price) ??
        0
      );
    });

    const orderDetails = computed(() => [
      {
        label: "Estimated Market Price",
        value: avgPrice.value * form.amount.$value,
      },
      {
        label: "Fees",
        value: 0,
      },
      {
        label: "Order Total",
        value: avgPrice.value * form.amount.$value,
      },
      {
        label: "Net",
        value: 0,
      },
    ]);

    const errorMessage = useErrorMessage(form);

    const marketBuy = computed(() => {
      return props.action === "buy" && props.actionType === "market";
    });

    const onSubmit = (): void => {
      const value: SubmitOrder = {
        symbolId: props.pair.symbolId,
        side: props.action,
        type: props.actionType === "stop" ? "stop_limit" : props.actionType,
        value: marketBuy.value
          ? form.amount.$value * avgPrice.value
          : undefined,
        price:
          props.actionType !== "market"
            ? form.stopOrLimitPrice.$value
            : undefined,
        quantity: !marketBuy.value ? form.amount.$value : undefined,
        stopPrice:
          props.actionType === "stop"
            ? form.stopOrLimitPrice.$value
            : undefined,
      };
      emit("submit", value);
    };

    return {
      form,
      onSubmit,
      errorMessage,
      formatCamelCase,
      orderDetails,
      base,
      quote,
      numberPrecision,
    };
  },
};
</script>

<template>
  <form @submit.prevent="onSubmit">
    <v-field :message="errorMessage('amount')" type="is-danger" :label="`${formatCamelCase(action)} Amount`">
      <v-input name="amount" autocomplete="amount" placeholder="amount" type="number"
               :step="numberPrecision(pair?.stepQuantity)" v-model.number="form.amount.$value" @wheel="$event.target.blur()"
               min="0"
      >
        <template #leftIcon>
          <span>{{ base.name }}</span>
        </template>
      </v-input>
    </v-field>

    <div v-if="['limit', 'stop'].includes(actionType)">
      <v-field :message="errorMessage('stopOrLimitPrice')" type="is-danger" class="is-capitalized"
               :label="`${actionType} Price`"
      >
        <v-input name="stopOrLimitPrice" autocomplete="stopOrLimitPrice" placeholder="stopOrLimitPrice" type="number"
                 :step="numberPrecision(pair?.stepPrice)" v-model.number="form.stopOrLimitPrice.$value"
                 @wheel="$event.target.blur()" :min="pair.minPrice"
        >
          <template #leftIcon>
            <span>{{ quote.name }}</span>
          </template>
        </v-input>
      </v-field>
    </div>

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

    <v-button expanded class="my-5 is-capitalized" :loading="loading" type="is-primary" native-type="submit"
              :disabled="form.$anyInvalid"
    >
      Place {{ action }} Order
    </v-button>
  </form>
</template>
