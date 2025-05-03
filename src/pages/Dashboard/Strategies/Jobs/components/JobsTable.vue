<script setup lang="ts">
import { computed, defineProps, ref } from "vue";
import { useTable } from "~/hooks";
import { $toast } from "~/main";
import { useUserEnabledS4Job } from "~/mutations/useUserEnabledS4Job";
import { JOBS_TABLE_COLUMNS } from "../JobsTable.constant";
import EditJobForm from "./EditJob.form.vue";

import type {
  UserEnabledS4JobParams,
  UserListS4JobsResponse,
} from "~/models/user";

interface Props {
  data: {
    data: UserListS4JobsResponse["data"];
  };
  isPending: boolean;
  isError: boolean;
  error: any;
  strategyId: number;
}

const props = defineProps<Props>();
const data = computed(() => props.data);
const datagrid = useTable(data, "data", JOBS_TABLE_COLUMNS);

const { mutate: enableJob } = useUserEnabledS4Job();

const handleEnableChange = (enabled: boolean, jobId: number) => {
  const params: UserEnabledS4JobParams = {
    jobId,
    isEnabled: enabled,
  };

  enableJob(params, {
    onSuccess: () => {
      $toast.success(`Job ${enabled ? "enabled" : "disabled"} successfully`);
    },
    onError: (error) => {
      $toast.error(error.message);
    },
  });
};

const onCheckboxChange = (event: Event, jobId: number) => {
  const checkbox = event.target as HTMLInputElement;
  handleEnableChange(checkbox.checked, jobId);
};

const showEditModal = ref(false);
const selectedJobId = ref<number | null>(null);

const handleEdit = (jobId: number) => {
  selectedJobId.value = jobId;
  showEditModal.value = true;
};

const handleEditClose = () => {
  showEditModal.value = false;
  selectedJobId.value = null;
};
</script>

<template>
  <div>
    <c-table :data="datagrid" :loading="isPending" :is-error="isError" :error-message="error">
      <template #isEnabled="{ row }">
        <input type="checkbox" :checked="row.isEnabled" @change="(e) => onCheckboxChange(e, row.id)" />
      </template>
      <template #actions="{ row }">
        <v-button type="is-primary" size="is-small" @click="handleEdit(row.id)">
          Edit
        </v-button>
      </template>
    </c-table>
    <modal v-model="showEditModal" title="Edit Job">
      <edit-job-form v-if="selectedJobId !== null" :job-id="selectedJobId" :strategy-id="strategyId"
        @close="handleEditClose" />
    </modal>
  </div>
</template>
