<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { $toast } from "~/main";
import type { UserSetS4JobParams } from "~/models/user";
import { useUserSetS4Job } from "~/mutations";
import { useUserGetS4Job } from "~/queries/user/useUserGetS4Job";

const props = defineProps<{
  jobId: number;
  strategyId: number;
}>();

const emit = defineEmits(["close"]);

const query = computed(() => ({
  jobId: props.jobId,
  strategyId: props.strategyId,
}));

const { data, isPending: isLoading } = useUserGetS4Job(query);
const { mutate: setJob, isPending: isSubmitting } = useUserSetS4Job();

const formData = reactive<UserSetS4JobParams>({
  jobId: props.jobId,
  leftSymbol: "",
  rightSymbol: "",
  tradeRight: false,
  leftMargin: false,
  leftSide: "",
  leftQuoteStep: 0,
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
      formData.jobId = newData.id;
      formData.leftSymbol = newData.leftSymbol;
      formData.rightSymbol = newData.rightSymbol;
      if (newData.config) {
        Object.assign(formData, newData.config);
      }
    }
  },
  { immediate: true },
);

const onSubmit = () => {
  setJob(formData, {
    onSuccess: () => {
      $toast.success("Job updated successfully");
      emit("close");
    },
    onError: (error) => {
      $toast.error(error.message);
    },
  });
};
</script>

<template>
    <form @submit.prevent="onSubmit">
        <loader v-if="isLoading" :loading="isLoading" />
        <template v-else>
            <v-columns>
                <!-- Left Side Configuration -->
                <v-column size="is-3">
                    <p class="title is-5 has-text-light">Left Side Configuration</p>
                    <v-field label="Left Symbol">
                        <v-input v-model="formData.leftSymbol" />
                    </v-field>
                    <v-field label="Left Side">
                        <v-input v-model="formData.leftSide" />
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
                        <v-input v-model="formData.orderQuantityLeft" />
                    </v-field>
                    <v-field label="Maintain Position Left">
                        <v-input type="number" v-model="formData.maintainPositionLeft" />
                    </v-field>
                    <v-field>
                        <v-checkbox v-model="formData.leftMargin">
                            <span class="ml-2">Left Margin</span>
                        </v-checkbox>
                    </v-field>
                </v-column>

                <!-- Right Side Configuration -->
                <v-column size="is-3">
                    <p class="title is-5 has-text-light">Right Side Configuration</p>
                    <v-field label="Right Symbol">
                        <v-input v-model="formData.rightSymbol" />
                    </v-field>
                    <v-field label="Right Side">
                        <v-input v-model="formData.rightSide" />
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
                        <v-input v-model="formData.orderQuantityRight" />
                    </v-field>
                    <v-field label="Maintain Position Right">
                        <v-input type="number" v-model="formData.maintainPositionRight" />
                    </v-field>
                    <v-field>
                        <v-checkbox v-model="formData.tradeRight">
                            <span class="ml-2">Trade Right</span>
                        </v-checkbox>
                    </v-field>
                    <v-field>
                        <v-checkbox v-model="formData.rightMargin">
                            <span class="ml-2">Right Margin</span>
                        </v-checkbox>
                    </v-field>
                </v-column>

                <!-- General Configuration -->
                <v-column size="is-3">
                    <p class="title is-5 has-text-light">General Settings</p>
                    <v-field label="Total Quantity">
                        <v-input type="number" v-model="formData.totalQuantity" />
                    </v-field>
                    <v-field label="Order Quantity">
                        <v-input v-model="formData.orderQuantity" />
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
                        <v-checkbox v-model="formData.bidirectional">
                            <span class="ml-2">Bidirectional</span>
                        </v-checkbox>
                    </v-field>
                </v-column>

                <!-- Thresholds Configuration -->
                <v-column size="is-3">
                    <p class="title is-5 has-text-light">Thresholds</p>
                    <v-field label="Open Threshold">
                        <v-input type="number" v-model="formData.openThreshold" step="0.1" />
                    </v-field>
                    <v-field label="Close Threshold">
                        <v-input type="number" v-model="formData.closeThreshold" step="0.1" />
                    </v-field>
                    <v-field label="Open Threshold Long Right">
                        <v-input type="number" v-model="formData.openThresholdLongRight" step="0.1" />
                    </v-field>
                    <v-field label="Close Threshold Long Right">
                        <v-input type="number" v-model="formData.closeThresholdLongRight" step="0.1" />
                    </v-field>
                    <v-field label="Open Threshold Short Right">
                        <v-input type="number" v-model="formData.openThresholdShortRight" step="0.1" />
                    </v-field>
                    <v-field label="Close Threshold Short Right">
                        <v-input type="number" v-model="formData.closeThresholdShortRight" step="0.1" />
                    </v-field>
                    <v-field>
                        <v-checkbox v-model="formData.takeProfit">
                            <span class="ml-2">Take Profit</span>
                        </v-checkbox>
                    </v-field>
                    <v-field>
                        <v-checkbox v-model="formData.stopLoss">
                            <span class="ml-2">Stop Loss</span>
                        </v-checkbox>
                    </v-field>
                </v-column>
            </v-columns>

            <v-columns class="mt-4">
                <!-- Additional Options -->
                <v-column size="is-6">
                    <p class="title is-5 has-text-light">Additional Options</p>
                    <v-field class="is-grouped is-grouped-multiline">
                        <v-checkbox v-model="formData.preserveOpen" class="mr-4">
                            <span class="ml-2">Preserve Open</span>
                        </v-checkbox>
                        <v-checkbox v-model="formData.stopFilledSpread" class="mr-4">
                            <span class="ml-2">Stop Filled Spread</span>
                        </v-checkbox>
                        <v-checkbox v-model="formData.closeOnStop" class="mr-4">
                            <span class="ml-2">Close On Stop</span>
                        </v-checkbox>
                    </v-field>
                </v-column>

                <v-column size="is-6">
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
                </v-column>
            </v-columns>

            <div class="buttons is-right mt-4">
                <v-button type="is-primary" native-type="submit" :loading="isSubmitting">
                    Save Changes
                </v-button>
            </div>
        </template>
    </form>
</template>