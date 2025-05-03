<script lang="ts">
import { computed, ref, toRef, watchEffect } from "vue";
import { useCssVariables } from "vue-composable";
import { formatCamelCase } from "~/utils/formatters";
import OrderForm from "./Order.form.vue";

import type {
  Price,
  TradingSymbol,
} from "~/store/modules/App/types/instruments.types";

import type { SubmitOrder } from "~/models/app/request";
import type { Balance } from "~/store/modules/App/types/wallet.types";
import useCurrentProducts from "../hooks/useCurrentProducts";

const ACTIONS = ["buy", "sell"];
const TYPES = ["market", "limit", "stop"];

export default {
  name: "Order",
  components: {
    OrderForm,
  },
  props: {
    pair: {
      type: Object as () => TradingSymbol,
      required: true,
    },
    currentBalance: {
      type: Object as () => Record<string, Balance>,
      required: true,
    },
    symbolStatus: {
      type: Object as () => Price,
    },
  },
  emits: ["submit"],
  setup(props, { emit }) {
    const activeTab = ref(0);
    const actionTab = ref(0);
    const typeTab = ref(0);

    const { base, quote } = useCurrentProducts(toRef(props, "pair"));

    watchEffect(() => {
      useCssVariables<any>([
        {
          name: "--blm-tabs-tgl-link-act-bg-clr",
          value: actionTab.value ? "var(--blm-dang)" : "var(--blm-sucs)",
        },
        {
          name: "--blm-tabs-tgl-link-act-bd-clr",
          value: actionTab.value ? "var(--blm-dang)" : "var(--blm-sucs)",
        },
      ]);
    });

    const ORDER_BALANCE_COLUMNS = computed(() => [
      { key: "product", label: "Product", type: "string" },
      { key: base.value.name, label: base.value.name, type: "number" },
      { key: quote.value.name, label: quote.value.name, type: "number" },
    ]);

    const balanceItems = computed(() => {
      const baseId = base.value.id as unknown as keyof Balance;
      const quoteId = quote.value.id as unknown as keyof Balance;

      const currentBalance = props.currentBalance!;

      return [
        {
          product: "Available Balance",
          [base.value.name]: currentBalance[baseId]?.available ?? 0,
          [quote.value.name]: currentBalance[quoteId]?.available ?? 0,
        },
        {
          product: "Hold",
          [base.value.name]: currentBalance[baseId]?.locked ?? 0,
          [quote.value.name]: currentBalance[quoteId]?.locked ?? 0,
        },
        {
          product: "Pending Deposits",
          [base.value.name]: "-",
          [quote.value.name]: "-",
        },
        {
          product: "Total Balance",
          [base.value.name]:
            (currentBalance[baseId]?.available ?? 0) +
            (currentBalance[baseId]?.locked ?? 0),
          [quote.value.name]:
            (currentBalance[quoteId]?.available ?? 0) +
            (currentBalance[quoteId]?.locked ?? 0),
        },
      ];
    });

    const onSubmit = (payload: SubmitOrder) => {
      emit("submit", payload);
    };

    return {
      activeTab,
      actionTab,
      typeTab,
      ACTIONS,
      TYPES,
      formatCamelCase,
      ORDER_BALANCE_COLUMNS,
      balanceItems,
      onSubmit,
    };
  },
};
</script>

<template>
  <v-tabs v-model="activeTab" expanded>
    <v-tab label="Order Entry">
      <div class="py-2 px-2">
        <v-tabs v-model="actionTab" expanded class="mb-0" type="is-toggle-rounded">
          <v-tab :label="formatCamelCase(action)" v-for="action in ACTIONS" :key="action">
            <div class="py-2 px-2">
              <p class="py-2">Order Type</p>

              <v-tabs v-model="typeTab" expanded>
                <v-tab :label="formatCamelCase(actionType)" v-for="actionType in TYPES" :key="actionType">
                  <order-form :symbol-status="symbolStatus" @submit="onSubmit" :action="action"
                              :action-type="actionType" :pair="pair" v-bind="$attrs"
                  />
                </v-tab>
              </v-tabs>
            </div>
          </v-tab>
        </v-tabs>
      </div>
    </v-tab>
    <v-tab label="Balances">
      <div class="py-2 px-2">
        <basic-table :items="balanceItems" :columns="ORDER_BALANCE_COLUMNS" />
      </div>
    </v-tab>
  </v-tabs>
</template>
