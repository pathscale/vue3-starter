<script lang="ts" setup>
import { ref, watch, defineProps, defineEmits } from 'vue'
import DataGrid from './DataGrid';

interface ICTAble {
  loading: boolean,
  pagination?: Boolean,
  perPage?: Number,
  total?: Number,
  currentPage?: Number,
  data: typeof DataGrid,
  errorMessage?: Error | string | null,
  isError?: Boolean,
}
const props = withDefaults(defineProps<ICTAble>(), {
  loading: true,
  data: new DataGrid()
})
const current = ref(props.currentPage)
const emit = defineEmits(['update:currentPage'])
watch(current, newValue => {
  emit('update:currentPage', newValue)
})
</script>

<template>
  <loader v-if="loading" :loading="loading" />
  <article v-if="isError" class="message is-danger">
    <div class="message-body">
      {{ errorMessage }}
    </div>
  </article>
  <v-table fullwidth :data="data" v-bind="$attrs" :pagination="false" striped>
    <template v-for="(_, name) in $slots" #[name]="props">
      <template v-if="pagination && name === 'footer'">
        <div :key="name" class="is-flex is-justify-content-center">
          <v-pagination :total="total" v-model:current="current" :range-before="1" :range-after="1" :per-page="perPage"
            aria-next-label="Next page" aria-previous-label="Previous page" aria-page-label="Page"
            aria-current-label="Current page" />
        </div>
      </template>

      <slot :name="name" v-bind="props" />
    </template>

    <template v-if="total && perPage" #footer>
      <div class="is-flex is-justify-content-center">
        <v-pagination :total="total" v-model:current="current" :range-before="2" :range-after="2" :per-page="perPage"
          aria-next-label="Next page" aria-previous-label="Previous page" aria-page-label="Page"
          aria-current-label="Current page" />
      </div>
    </template>
  </v-table>
</template>
