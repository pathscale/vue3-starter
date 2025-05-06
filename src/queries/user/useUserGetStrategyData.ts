import { useQuery } from '@tanstack/vue-query'
import type { ComputedRef } from 'vue'
import { ref, watchEffect } from 'vue'
import { api } from '~/api'
import type { UserGetPrice0Params, UserGetPrice0Response as ApiResponse } from '~/models/user'
import { useGlobalStore } from '~/store'

interface ApiParams extends UserGetPrice0Params {
  strategyId: number
}

const getFn = async (params?: ApiParams) => {
  if (params?.strategyId === 1) {
    const response = await api.app.UserGetPriceDifference<ApiResponse, ApiParams>(params)
    return response.params.data
  }

  if (params?.strategyId === 2) {
    const response = await api.app.UserGetBestBidAskAcrossExchanges<ApiResponse, ApiParams>(params)
    return response.params.data
  }

  const response = await api.app.UserGetPrice0<ApiResponse, ApiParams>(params)
  return response.params.data
}

export const useUserGetStrategyData = (
  params: ComputedRef<ApiParams>,
  options: ComputedRef<{ enabled: boolean }>,
) => {
  const globalStore = useGlobalStore()
  const enabled = ref(false)
  watchEffect(() => {
    enabled.value = globalStore.isConnected && options.value.enabled
  })

  const query = useQuery({
    queryKey: ['UserGetStrategyData', params],
    queryFn: () => getFn(params.value),
    retry: 1,
    enabled: enabled,
  })
  return query
}
