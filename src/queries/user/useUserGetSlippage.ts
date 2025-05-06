import { useQuery } from '@tanstack/vue-query'
import type { ComputedRef } from 'vue'
import { ref, watchEffect } from 'vue'
import { api } from '~/api'
import type {
  UserGetSlippage1Params,
  UserGetSlippage1Response as ApiResponse,
  UserGetS2SlippageResponse,
  UserGetS3SlippageResponse,
} from '~/models/user'
import { useGlobalStore } from '~/store'

interface ApiParams extends UserGetSlippage1Params {
  strategyId: number
}

const getFn = async (params?: ApiParams) => {
  if (params?.strategyId === 1) {
    const response = await api.app.UserGetSlippage1<ApiResponse, ApiParams>(params)
    return { data: response.params.data }
  } else if (params?.strategyId === 2) {
    const response = await api.app.UserGetS2Slippage<UserGetS2SlippageResponse, ApiParams>(params)
    return { data: response.params.data }
  } else if (params?.strategyId === 3) {
    const response = await api.app.UserGetS3Slippage<UserGetS3SlippageResponse, ApiParams>(params)
    return { data: response.params.data }
  }

  return { data: [] }
}

export const useUserGetSlippage = (params: ComputedRef<ApiParams>) => {
  const globalStore = useGlobalStore()
  const enabled = ref(false)

  watchEffect(() => {
    enabled.value = globalStore.isConnected
  })

  const query = useQuery({
    queryKey: ['UserGetSlippage', params],
    queryFn: () => getFn(params.value),
    retry: 1,
    enabled: enabled,
    refetchInterval: 3000,
  })
  return query
}
