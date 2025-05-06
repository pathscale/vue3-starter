import { useQuery } from '@tanstack/vue-query'
import type { ComputedRef } from 'vue'
import { ref, watchEffect } from 'vue'
import { api } from '~/api'
import type {
  UserGetOrder1Params,
  UserGetOrder1Response,
  UserGetS2OrderResponse,
  UserGetOrderResponse,
} from '~/models/user'
import { useGlobalStore } from '~/store'

interface ApiParams extends UserGetOrder1Params {
  strategyId: number
}

const getFn = async (params?: ApiParams) => {
  if (params?.strategyId === 1) {
    const response = await api.app.UserGetOrder1<UserGetOrder1Response, ApiParams>(params)
    return { orders: response.params.data }
  } else if (params?.strategyId === 2) {
    const response = await api.app.UserGetS2Order<UserGetS2OrderResponse, ApiParams>(params)
    return { orders: response.params.data }
  }
  const response = await api.app.UserGetOrder<UserGetOrderResponse, ApiParams>(params)
  return { orders: response.params.data }
}

export const useUserGetOrder = (params: ComputedRef<ApiParams>) => {
  const globalStore = useGlobalStore()
  const enabled = ref(false)

  watchEffect(() => {
    enabled.value = globalStore.isConnected
  })

  const query = useQuery({
    queryKey: ['UserGetOrder', params],
    queryFn: () => getFn(params.value),
    retry: 1,
    enabled: enabled,
    refetchInterval: 3000,
  })
  return query
}
