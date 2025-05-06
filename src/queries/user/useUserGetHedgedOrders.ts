import { useQuery } from '@tanstack/vue-query'
import type { ComputedRef } from 'vue'
import { ref, watchEffect } from 'vue'
import { api } from '~/api'
import type {
  UserGetHedgedOrdersParams as ApiParams,
  UserGetHedgedOrdersResponse as ApiResponse,
} from '~/models/user'
import { useGlobalStore } from '~/store'

const getFn = async (params?: ApiParams) => {
  const response = await api.app.UserGetHedgedOrders<ApiResponse, ApiParams>(params)
  return { orders: response.params.data }
}

export const useUserGetHedgedOrders = (params: ComputedRef<ApiParams>) => {
  const globalStore = useGlobalStore()
  const enabled = ref(false)

  watchEffect(() => {
    enabled.value = globalStore.isConnected
  })

  const query = useQuery({
    queryKey: ['UserGetHedgedOrders', params],
    queryFn: () => getFn(params.value),
    retry: 1,
    enabled: enabled,
    refetchInterval: 3000,
  })
  return query
}
