<script setup lang="ts">
import { DataGrid, VTable } from "@pathscale/vue3-ui";
import { reactive, ref, watch } from "vue";
import { useTable } from "~/hooks";
import { $toast } from "~/main";
import type { UserGetEncryptedKeyResponse } from "~/models/user";
import {
  useUserDecryptEncryptedKey,
  useUserDeleteEncryptedKey,
  useUserStartService,
} from "~/mutations";
import { useUserGetEncryptedKey } from "~/queries/user";
import EditEncryptedKeyForm from "./EditEncryptedKeyForm.vue";

const datagrid = ref(new DataGrid());

datagrid.value.addColumn("accountId", "Account ID", "string");
datagrid.value.addColumn("alias", "Alias", "string");
datagrid.value.addColumn("encryptionKey", "Passphrase", "string");
datagrid.value.addColumn("exchange", "Exchange", "string");
datagrid.value.addColumn("ciphertext", "Encrypted Material", "string");
datagrid.value.addColumn("actions", "Actions", "custom");

const { data, isPending, isError, error } = useUserGetEncryptedKey();
const userDeleteEncryptedKey = useUserDeleteEncryptedKey();
const userStartService = useUserStartService();
const userDecryptEncryptedKey = useUserDecryptEncryptedKey();
const encryptionKeys = reactive<Record<string, string | undefined>>({});
const isDecrypting = reactive<Record<string, boolean>>({});
const isStarting = reactive<Record<string, boolean>>({});
const isDeleting = reactive<Record<string, boolean>>({});
const showAddKeyModal = ref(false);

watch(
  data,
  (newData) => {
    if (newData?.data) {
      datagrid.value.rows = [];
      newData.data.forEach((row) => {
        datagrid.value.addRow({
          accountId: row.accountId,
          alias: row.alias,
          encryptionKey: "",
          exchange: row.exchange,
          ciphertext: row.ciphertext,
          actions: row,
        });
      });
    }
  },
  { immediate: true },
);

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const onDelete = async (row: UserGetEncryptedKeyResponse["data"][0]) => {
  try {
    isDeleting[row.accountId] = true;
    await userDeleteEncryptedKey.mutateAsync(row);
  } catch (error: any) {
    $toast.error(error?.message);
  } finally {
    isDeleting[row.accountId] = false;
  }
};

const onDecrypt = async (row: UserGetEncryptedKeyResponse["data"][0]) => {
  try {
    isDecrypting[row.accountId] = true;
    await userDecryptEncryptedKey.mutateAsync({
      exchange: capitalizeFirstLetter(row.exchange),
      accountId: row.accountId,
      encryptionKey: encryptionKeys[row.accountId] as string,
    });
  } catch (error: any) {
    $toast.error(error?.message);
  } finally {
    isDecrypting[row.accountId] = false;
  }
};

const onStart = async (row: UserGetEncryptedKeyResponse["data"][0]) => {
  try {
    isStarting[row.accountId] = true;
    await userStartService.mutateAsync({
      keys: [row],
    });
  } catch (error: any) {
    $toast.error(error?.message);
  } finally {
    isStarting[row.accountId] = false;
  }
};
</script>

<template>
  <div>
    <v-table :data="datagrid" :loading="isPending" :is-error="isError" :error-message="error" fullwidth striped
      hoverable>
      <template #actions="{ row }">
        <div class="buttons">
          <v-button size="is-small" type="is-info" @click="onDecrypt(row.actions)"
            :disabled="!encryptionKeys[row.actions.accountId]" :loading="isDecrypting[row.actions.accountId]">
            Unlock
          </v-button>
          <v-button size="is-small" type="is-success" @click="onStart(row.actions)"
            :disabled="!encryptionKeys[row.actions.accountId]" :loading="isStarting[row.actions.accountId]">
            Start
          </v-button>
          <v-button size="is-small" type="is-danger" @click="onDelete(row.actions)"
            :loading="isDeleting[row.actions.accountId]">
            Delete
          </v-button>
        </div>
      </template>

      <template #ciphertext="{ row }">
        {{ row.ciphertext.slice(0, 10) }}...
      </template>

      <template #accountId="{ row }">
        {{ row.accountId.slice(0, 10) }}...
      </template>

      <template #encryptionKey="{ row }">
        <v-input v-model="encryptionKeys[row.actions.accountId]" placeholder="Passphrase" />
      </template>

      <template #footer>
        <v-button outlined @click="showAddKeyModal = true" class="has-text-bold">+ Add Encrypted Key</v-button>
      </template>
    </v-table>

    <modal v-model="showAddKeyModal" title="Add Encrypted Key">
      <edit-encrypted-key-form @close="showAddKeyModal = false" />
    </modal>
  </div>
</template>
