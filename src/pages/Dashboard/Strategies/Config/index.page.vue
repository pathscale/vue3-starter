<script lang="ts" setup>
import { computed, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import type { UserSetS4ConfigParams } from "~/models/user";
import { useUserSetS4Config } from "~/mutations";
import { useUserGetConfig } from "~/queries/user";
const route = useRoute();
const strategyId = computed(() =>
  Number.parseInt((route.params.strategyId as string) || "0"),
);

const query = computed(() => ({
  strategyId: strategyId.value,
}));

const { data, isPending, isError, error } = useUserGetConfig(query);
const { mutate: setConfig, isPending: isSubmitting } = useUserSetS4Config();

const formData = reactive<UserSetS4ConfigParams>({
  tradeRight: false,
  leftLeg: "",
  leftMargin: false,
  leftSide: "",
  leftQuoteStep: 0,
  rightLeg: "",
  rightMargin: false,
  rightSide: "",
  rightQuoteStep: 0,
  bidirectional: false,
  totalQuantity: 0,
  orderQuantity: "",
  orderQuantityRight: "",
  orderQuantityLeft: "",
  maintainPosition: 0,
  maintainPositionRight: 0,
  maintainPositionLeft: 0,
  maxUnhedged: 0,
  openThreshold: 0,
  openThresholdLongRight: 0,
  openThresholdShortRight: 0,
  closeThreshold: 0,
  closeThresholdLongRight: 0,
  closeThresholdShortRight: 0,
  maxOrderNumber: 0,
  profitGoal: 0,
  leftMakerFee: 0,
  leftTakerFee: 0,
  rightMakerFee: 0,
  rightTakerFee: 0,
  rightPriceSlippage: 0,
  takeProfit: false,
  stopLoss: false,
  hideStatus: false,
  orderDelayMs: 0,
  preserveOpen: false,
  stopFilledSpread: false,
  closeOnStop: false,
  stopThreshold: 0,
  stopCounter: 0,
  stopTimePeriodMs: 0,
});

watch(
  data,
  (newData) => {
    if (newData) {
      Object.assign(formData, newData);
    }

    console.log("formData", formData);
  },
  { immediate: true },
);
function submitForm() {
  setConfig({ ...formData });
}
</script>

<template>
  <div>
    <loader v-if="isPending" :loading="isPending" />
    <div v-if="isError">Error: {{ error }}</div>
    <div v-if="data">
      <form @submit.prevent="submitForm">
        <v-columns>
          <!-- Left Side Configuration -->
          <v-column size="is-3">
            <p class="title is-5 has-text-light">Left Side Configuration</p>
            <v-field label="Left Leg">
              <v-input type="text" v-model="formData.leftLeg" />
            </v-field>
            <v-field label="Left Side">
              <v-input type="text" v-model="formData.leftSide" />
            </v-field>
            <v-field label="Left Quote Step">
              <v-input type="number" v-model="formData.leftQuoteStep" step="0.01" />
            </v-field>
            <v-field label="Left Maker Fee">
              <v-input type="number" v-model="formData.leftMakerFee" step="0.00001" />
            </v-field>
            <v-field label="Left Taker Fee">
              <v-input type="number" v-model="formData.leftTakerFee" step="0.00001" />
            </v-field>
            <v-field label="Order Quantity Left">
              <v-input type="text" v-model="formData.orderQuantityLeft" />
            </v-field>
            <v-field label="Maintain Position Left">
              <v-input type="number" v-model="formData.maintainPositionLeft" />
            </v-field>
            <v-field>
              <v-checkbox v-model="formData.leftMargin"><span class="ml-2">Left Margin</span></v-checkbox>
            </v-field>
          </v-column>

          <!-- Right Side Configuration -->
          <v-column size="is-3">
            <p class="title is-5 has-text-light">Right Side Configuration</p>
            <v-field label="Right Leg">
              <v-input type="text" v-model="formData.rightLeg" />
            </v-field>
            <v-field label="Right Side">
              <v-input type="text" v-model="formData.rightSide" />
            </v-field>
            <v-field label="Right Quote Step">
              <v-input type="number" v-model="formData.rightQuoteStep" step="0.01" />
            </v-field>
            <v-field label="Right Maker Fee">
              <v-input type="number" v-model="formData.rightMakerFee" step="0.001" />
            </v-field>
            <v-field label="Right Taker Fee">
              <v-input type="number" v-model="formData.rightTakerFee" step="0.001" />
            </v-field>
            <v-field label="Right Price Slippage">
              <v-input type="number" v-model="formData.rightPriceSlippage" step="0.0001" />
            </v-field>
            <v-field label="Order Quantity Right">
              <v-input type="text" v-model="formData.orderQuantityRight" />
            </v-field>
            <v-field label="Maintain Position Right">
              <v-input type="number" v-model="formData.maintainPositionRight" />
            </v-field>
            <v-field>
              <v-checkbox v-model="formData.tradeRight"><span class="ml-2">Trade Right</span></v-checkbox>
            </v-field>
            <v-field>
              <v-checkbox v-model="formData.rightMargin"><span class="ml-2">Right Margin</span></v-checkbox>
            </v-field>
          </v-column>
        </v-columns>
        <v-columns>

          <!-- General Configuration -->
          <v-column size="is-3">
            <p class="title is-5 has-text-light">General Settings</p>
            <v-field label="Total Quantity">
              <v-input type="number" v-model="formData.totalQuantity" />
            </v-field>
            <v-field label="Order Quantity">
              <v-input type="text" v-model="formData.orderQuantity" />
            </v-field>
            <v-field label="Maintain Position">
              <v-input type="number" v-model="formData.maintainPosition" />
            </v-field>
            <v-field label="Max Unhedged">
              <v-input type="number" v-model="formData.maxUnhedged" />
            </v-field>
            <v-field label="Max Order Number">
              <v-input type="number" v-model="formData.maxOrderNumber" />
            </v-field>
            <v-field label="Profit Goal">
              <v-input type="number" v-model="formData.profitGoal" />
            </v-field>
            <v-field label="Order Delay (ms)">
              <v-input type="number" v-model="formData.orderDelayMs" />
            </v-field>
            <v-field>
              <v-checkbox v-model="formData.bidirectional"><span class="ml-2">Bidirectional</span></v-checkbox>
            </v-field>
          </v-column>

          <!-- Thresholds Configuration -->
          <v-column size="is-3">
            <p class="title is-5 has-text-light">Thresholds</p>
            <v-field label="Open Threshold">
              <v-input type="number" v-model="formData.openThreshold" step="0.01" />
            </v-field>
            <v-field label="Close Threshold">
              <v-input type="number" v-model="formData.closeThreshold" step="0.01" />
            </v-field>
            <v-field label="Open Threshold Long Right">
              <v-input type="number" v-model="formData.openThresholdLongRight" step="0.01" />
            </v-field>
            <v-field label="Close Threshold Long Right">
              <v-input type="number" v-model="formData.closeThresholdLongRight" step="0.01" />
            </v-field>
            <v-field label="Open Threshold Short Right">
              <v-input type="number" v-model="formData.openThresholdShortRight" step="0.01" />
            </v-field>
            <v-field label="Close Threshold Short Right">
              <v-input type="number" v-model="formData.closeThresholdShortRight" step="0.01" />
            </v-field>
            <v-field>
              <v-checkbox v-model="formData.takeProfit"><span class="ml-2">Take Profit</span></v-checkbox>
            </v-field>
            <v-field>
              <v-checkbox v-model="formData.stopLoss"><span class="ml-2">Stop Loss</span></v-checkbox>
            </v-field>
          </v-column>
        </v-columns>

        <v-columns class="mt-4">
          <!-- Trading Options -->
          <v-column size="is-3">
            <p class="title is-5 has-text-light">Additional Options</p>
            <v-field class="is-grouped is-grouped-multiline">
              <v-checkbox v-model="formData.hideStatus" class="mr-4"><span class="ml-2">Hide Status</span></v-checkbox>
              <v-checkbox v-model="formData.preserveOpen" class="mr-4"><span class="ml-2">Preserve
                  Open</span></v-checkbox>
              <v-checkbox v-model="formData.stopFilledSpread" class="mr-4"><span class="ml-2">Stop Filled
                  Spread</span></v-checkbox>
              <v-checkbox v-model="formData.closeOnStop" class="mr-4"><span class="ml-2">Close On
                  Stop</span></v-checkbox>
            </v-field>
          </v-column>

          <v-column size="is-3 ">
            <p class="title is-5 has-text-light">Stop Settings</p>
            <v-field label="Stop Threshold">
              <v-input type="number" v-model="formData.stopThreshold" step="0.1" />
            </v-field>
            <v-field label="Stop Counter">
              <v-input type="number" v-model="formData.stopCounter" />
            </v-field>
            <v-field label="Stop Time Period (ms)">
              <v-input type="number" v-model="formData.stopTimePeriodMs" />
            </v-field>

            <div class="buttons is-right">
              <v-button native-type="submit" :loading="isSubmitting">Save</v-button>
            </div>
          </v-column>
        </v-columns>


      </form>
    </div>
  </div>
</template>