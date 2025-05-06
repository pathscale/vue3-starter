import { useQuery } from '@tanstack/vue-query'
import type { ComputedRef } from 'vue'
import { ref, watchEffect } from 'vue'
import { api } from '~/api'
import { queryClient } from '~/main'
import type { UserSubPrice0Params, UserSubPrice0Response as StreamResponse } from '~/models/user'

import { useGlobalStore } from '~/store'

interface ApiParams extends UserSubPrice0Params {
  strategyId: number
}

interface ApiResponse {
  data: StreamResponse
  lastUpdatedAt: number
}

const getFn = async (params?: ApiParams) => {
  if (params?.strategyId === 1) {
    const response = await api.app.UserSubPriceDifference<ApiResponse, ApiParams>(params)
    return response.params
  }

  if (params?.strategyId === 2) {
    const response = await api.app.UserSubBestBidAskAcrossExchanges<ApiResponse, ApiParams>(params)
    return response.params
  }

  const response = await api.app.UserSubPrice0<ApiResponse, ApiParams>(params)
  return response.params
}

export const updateUserSubStrategyData = (payload: StreamResponse) => {
  if (payload && Object.keys(payload).length) {
    const lastUpdatedAt = Date.now()
    queryClient.setQueryData(['UserSubStrategyData'], {
      data: payload,
      lastUpdatedAt,
    })
  }
}

export const useUserSubStrategyData = (
  params: ApiParams,
  options: ComputedRef<{ enabled: boolean }>,
) => {
  const globalStore = useGlobalStore()
  const enabled = ref(false)

  watchEffect(() => {
    enabled.value = globalStore.isConnected && options.value.enabled
  })

  const query = useQuery({
    queryKey: ['UserSubStrategyData'],
    queryFn: () => getFn(params),
    enabled,
    retry: 1,
  })
  return query
}
