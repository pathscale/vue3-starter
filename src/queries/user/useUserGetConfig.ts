import { useQuery } from '@tanstack/vue-query'
import type { ComputedRef } from 'vue'
import { ref, watchEffect } from 'vue'
import { api } from '~/api'
import type { UserGetS4ConfigParams, UserGetS4ConfigResponse } from '~/models/user'
import { useGlobalStore } from '~/store'

interface ApiParams extends UserGetS4ConfigParams {
  strategyId: number
}

const getFn = async (params?: ApiParams) => {
  if (params?.strategyId === 4) {
    const response = await api.app.UserGetS4Config<UserGetS4ConfigResponse, ApiParams>(params)
    return response.params
  }
  return {}
}

export const useUserGetConfig = (params: ComputedRef<ApiParams>) => {
  const globalStore = useGlobalStore()
  const enabled = ref(false)

  watchEffect(() => {
    enabled.value = globalStore.isConnected
  })

  const query = useQuery({
    queryKey: ['UserGetConfig'],
    queryFn: () => getFn(params.value),
    retry: 1,
    enabled: enabled,
    refetchInterval: 3000,
  })
  return query
}
