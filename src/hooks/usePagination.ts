import type { Ref } from 'vue'
import { computed, ref, watchEffect } from 'vue'

const usePagination = <T extends Record<string, any>>(
  data: Ref<T | undefined>,
  key: keyof T,
  filterParams: Record<string, any>,
) => {
  const currentPage = ref(1)

  const totalKey = `${key as string}Total`

  const total = computed(() => {
    if (data.value && totalKey in data.value) {
      return data.value[totalKey]
    }
    // The dropback scheme when there is no totalKey
    if (data?.value && data.value[key]?.length === filterParams.limit) {
      return currentPage.value * filterParams.limit + 1
    }
    return currentPage.value * filterParams.limit
  })

  watchEffect(() => {
    filterParams.offset = (currentPage.value - 1) * filterParams.limit
  })
  return {
    currentPage,
    total,
  }
}

export default usePagination
