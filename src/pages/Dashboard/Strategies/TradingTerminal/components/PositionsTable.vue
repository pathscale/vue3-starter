<script setup lang="ts">
import { computed, defineProps, reactive } from "vue";
import { useTable } from "~/hooks";
import { $toast } from "~/main";
import type { UserSubStrategy3PositionsClosingResponse } from "~/models/user";
import { useUserS3ReleasePosition } from "~/mutations/useUserS3ReleasePosition";
import type { RecordType } from "~/types";

interface Props {
  data:
    | {
        positions: UserSubStrategy3PositionsClosingResponse["data"];
      }
    | undefined;
  isPending: boolean;
  isError: boolean;
  error: any;
  showCancelOrClose?: boolean;
}

const props = defineProps<Props>();

const isCanceling = reactive<RecordType>({});
const userS3ReleasePosition = useUserS3ReleasePosition();

const onCancel = async (
  row: UserSubStrategy3PositionsClosingResponse["data"][0],
) => {
  try {
    isCanceling[row.id] = true;
    await userS3ReleasePosition.mutateAsync({
      eventId: row.eventId,
    });
  } catch (error: any) {
    $toast.error(error?.message);
  } finally {
    isCanceling[row.id] = false;
  }
};

const TABLE_COLUMNS = [
  { key: "id", label: "Local ID", type: "number" },
  { key: "eventId", label: "Event ID", type: "custom" },
  { key: "cloid", label: "Client Order ID", type: "string" },
  { key: "exchange", label: "Exchange", type: "string" },
  { key: "symbol", label: "Symbol", type: "string" },
  { key: "status", label: "Status", type: "string" },
  { key: "price", label: "Price", type: "number" },
  { key: "size", label: "Size", type: "number" },
  { key: "filledSize", label: "Filled Size", type: "number" },
];

if (props.showCancelOrClose) {
  TABLE_COLUMNS.push({
    key: "cancelOrClose",
    label: "Cancel or Close",
    type: "string",
  });
}

const data = computed(() => props.data);
const datagrid = useTable(data, "positions", TABLE_COLUMNS);
</script>
<template>
  <c-table :data="datagrid" :loading="isPending" :is-error="isError" :error-message="error">
    <template #cancelOrClose="scope">
      <div class="actions">
        <v-button type="is-danger" class="is-capitalized" @click="onCancel(scope.row)"
          :loading="isCanceling[scope.row.id]">
          {{ scope.row.cancelOrClose }}
        </v-button>
      </div>
    </template>

  </c-table>
</template>
