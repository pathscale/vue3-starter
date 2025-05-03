<script setup lang="ts">
import { reactive, toRaw } from "vue";
import { $toast } from "~/main";
import { useUserSetEncryptedKey } from "~/mutations";

const emit = defineEmits(["close"]);

const form = reactive({
  exchange: "Hyperliquid",
  accountId: "",
  ciphertext: "",
  alias: "",
});

const userSetEncryptedKey = useUserSetEncryptedKey();

const isAddEncryptedButtonDisabled = () =>
  !form.accountId || !form.alias || !form.ciphertext || !form.exchange;

const onSubmit = async () => {
  await userSetEncryptedKey.mutateAsync({ key: [toRaw(form)] });
  $toast.success("Sent");
  emit("close");
};

const onCancel = () => {
  emit("close");
};
</script>

<template>
    <form @submit.prevent="onSubmit">
        <v-field label="Alias">
            <v-input placeholder="Alias" v-model="form.alias" />
        </v-field>
        <v-field label="Account ID">
            <v-input placeholder="Account ID" v-model="form.accountId" />
        </v-field>
        <v-field label="Encrypted Material">
            <v-input placeholder="Encrypted Material" v-model="form.ciphertext" />
        </v-field>
        <v-field label="Exchange">
            <v-select v-model="form.exchange">
                <option value="Hyperliquid">Hyperliquid</option>
                <option value="BinanceSpot">BinanceSpot</option>
                <option value="BinanceFutures">BinanceFutures</option>
            </v-select>
        </v-field>
        <div class="buttons is-right mt-4">
            <v-button size="is-small" native-type="submit" :loading="userSetEncryptedKey.isPending.value"
                :disabled="isAddEncryptedButtonDisabled()">
                Save
            </v-button>
            <v-button size="is-small" type="is-danger" @click.prevent="onCancel">
                Cancel
            </v-button>
        </div>
    </form>
</template>