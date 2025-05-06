import { useQuery } from '@tanstack/vue-query'
import type { ComputedRef } from 'vue'
import { ref, watchEffect } from 'vue'
import { api } from '~/api'
import type {
  UserGetLivePosition1Response,
  UserGetS2LivePositionResponse,
  UserGetStrategyLivePositionResponse,
} from '~/models/user'
import { useGlobalStore } from '~/store'

interface ApiParams extends UserGetStrategyLivePositionResponse {
  strategyId: number
}

const getFn = async (params?: ApiParams) => {
  if (params?.strategyId === 1) {
    const response = await api.app.UserGetLivePosition1<UserGetLivePosition1Response>(params)
    return { data: response.params.data }
  } else if (params?.strategyId === 2) {
    const response = await api.app.UserGetS2LivePosition<UserGetS2LivePositionResponse>(params)
    return { data: response.params.data }
  }
  const response = await api.app.UserGetStrategyLivePosition<UserGetStrategyLivePositionResponse>(
    params,
  )
  return { data: response.params.data }
}

export const useUserGetLivePosition = (params: ComputedRef<ApiParams>) => {
  const globalStore = useGlobalStore()
  const enabled = ref(false)

  watchEffect(() => {
    enabled.value = globalStore.isConnected
  })

  const query = useQuery({
    queryKey: ['UserGetLivePosition', params],
    queryFn: () => getFn(params.value),
    retry: 1,
    enabled: enabled,
    refetchInterval: 3000,
  })
  return query
}
