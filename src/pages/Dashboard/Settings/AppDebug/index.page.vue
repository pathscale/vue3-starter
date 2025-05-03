<script lang="ts" setup>
import { useTable } from "~/hooks";
import { SettingsLayout } from "~/layouts";
import { useUserGetDebugLog } from "~/queries/user";
import { formatDateYMDHIS } from "~/utils/formatters";
const { data, isPending, isError, error } = useUserGetDebugLog();

const TABLE_COLUMNS = [
  { key: "datetime", label: "Datetime", type: "string" },
  { key: "level", label: "Level", type: "string" },
  { key: "thread", label: "Thread", type: "string" },
  { key: "path", label: "Path", type: "string" },
  { key: "lineNumber", label: "Line Number", type: "string" },
  { key: "message", label: "Message", type: "string" },
];

const datagrid = useTable(data, "data", TABLE_COLUMNS);
</script>

<template>
  <settings-layout>
    <c-table :data="datagrid" :loading="isPending" :is-error="isError" :error-message="error">
      <template #datetime="scope">
        {{ formatDateYMDHIS(scope.row.datetime) }}
      </template>
    </c-table>
  </settings-layout>
</template>
