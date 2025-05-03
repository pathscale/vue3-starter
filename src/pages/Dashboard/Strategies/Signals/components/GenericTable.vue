<script setup lang="ts">
import { computed } from "vue";
import { useTable } from "~/hooks";

interface Props {
  data: any[];
  columns: any[];
  name: string;
}
const props = defineProps<Props>();

const data = computed(() => {
  return { data: [props.data] };
});

const datagrid = useTable(data, "data", props.columns);
</script>

<template>
  <div class="title is-size-7">{{ props.name }}</div>
  <c-table :data="datagrid" :loading="false" />
</template>
