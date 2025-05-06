import { useQuery } from '@tanstack/vue-query'
import type { ComputedRef } from 'vue'
import { ref, watchEffect } from 'vue'
import { api } from '~/api'
import type { UserGetComplexSignal1Response, UserGetComplexSignal1Params } from '~/models/user'
import { useGlobalStore } from '~/store'

interface ApiParams extends UserGetComplexSignal1Params {
  strategyId: number
}

const getFn = async (params?: ApiParams) => {
  if (params?.strategyId === 1) {
    const response = await api.app.UserGetComplexSignal1<UserGetComplexSignal1Response, ApiParams>(
      params,
    )
    return response.params.data
  }
  return []
}

export const useUserGetComplexSignal = (params: ComputedRef<ApiParams>) => {
  const globalStore = useGlobalStore()
  const enabled = ref(false)

  watchEffect(() => {
    enabled.value = globalStore.isConnected
  })

  const query = useQuery({
    queryKey: ['UserGetComplexSignal', params],
    queryFn: () => getFn(params.value),
    retry: 1,
    enabled: enabled,
    refetchInterval: 3000,
  })
  return query
}
