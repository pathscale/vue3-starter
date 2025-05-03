<script lang="ts" setup>
import { computed, reactive, toRaw } from "vue";
import { useRoute } from "vue-router";
import { useTable } from "~/hooks";
import { $toast } from "~/main";
import type { UserGetBlacklistResponse } from "~/models/user";
import { useUserAddBlacklist, useUserRemoveBlacklist } from "~/mutations";
import { useUserGetBlacklist, useUserGetSymbolList } from "~/queries/user";
const route = useRoute();
const strategyId = computed(() =>
  Number.parseInt((route.params.strategyId as string) || "0"),
);

const { data, isPending, isError, error } = useUserGetBlacklist({
  strategyId: strategyId.value,
});

const { data: symbols, isLoading: isLoadingSymbols } = useUserGetSymbolList({
  strategyId: strategyId.value,
});

const userAddBlacklist = useUserAddBlacklist();
const userRemoveBlacklist = useUserRemoveBlacklist();

const TABLE_COLUMNS = [
  { key: "symbol", label: "Symbol", type: "string" },
  { key: "status", label: "Status", type: "string" },
  { key: "flag", label: "Flag", type: "string" },
  { key: "actions", label: "Actions", type: "custom" },
];

const datagrid = useTable(data, "data", TABLE_COLUMNS);
const onDelete = async (row: UserGetBlacklistResponse["data"][0]) => {
  await userRemoveBlacklist.mutateAsync({
    strategyId: strategyId.value,
    list: [
      {
        symbol: row.symbol,
      },
    ],
  });
};

const form = reactive({
  symbol: "",
});

const onSubmit = async () => {
  await userAddBlacklist.mutateAsync({
    strategyId: strategyId.value,
    list: [toRaw(form)],
  });
  $toast.success("Sent");
};
</script>


<template>
  <div>
    <v-columns>
      <v-column size="is-6">
        <div class="level">
          <div class="subtitle">Blacklist</div>
        </div>
        <c-table :data="datagrid" :loading="isPending" :is-error="isError" :error-message="error">
          <template #actions="scope">
            <v-button type="is-danger" @click="onDelete(scope.row)">
              <icon name="trash" fill="white" bundle="icons" />
            </v-button>
          </template>
        </c-table>
      </v-column>
      <v-column />
      <v-column size="is-5">
        <div class="subtitle">Add Symbol to Blacklist</div>
        <form @submit.prevent="onSubmit">
          <v-field label="Choose Symbol">
            <v-select v-model="form.symbol" color="is-info" placeholder="Info" size="is-normal">
              <option value="" disabled selected>Select your option</option>
              <option :value="item.symbol" v-for="(item, index) in symbols" :disabled="!item.flag" :key="index">
                {{ item.symbol }}
              </option>
            </v-select>
          </v-field>
          <v-button native-type="submit" type="is-black" :loading="userAddBlacklist.isPending.value">Submit</v-button>
          <v-field v-show="userAddBlacklist.error.value" :message="userAddBlacklist.error.value" type="is-danger" />
        </form>
      </v-column>
    </v-columns>
  </div>
</template>
