import { useQuery } from '@tanstack/vue-query'
import { ref, watchEffect } from 'vue'
import { api } from '~/api'
import { queryClient } from '~/main'
import type {
  UserSubPositionParams as ApiParams,
  UserSubPositionResponse as StreamResponse,
} from '~/models/user'

import { useGlobalStore } from '~/store'

interface ApiResponse {
  data: StreamResponse
  lastUpdatedAt: number
}

const getFn = async (params?: ApiParams) => {
  const response = await api.app.UserSubPosition<ApiResponse, ApiParams>(params)
  return response.params
}

export const unsubscribeUserSubPosition = () => getFn({ unsubscribe: true })

export const updateUserSubPosition = (payload: StreamResponse) => {
  if (payload && Object.keys(payload)) {
    const lastUpdatedAt = Date.now()
    queryClient.setQueryData(['UserSubPosition'], {
      data: payload,
      lastUpdatedAt,
    })
  }
}

export const useUserSubPosition = (params: ApiParams) => {
  const globalStore = useGlobalStore()
  const enabled = ref(false)

  watchEffect(() => {
    enabled.value = globalStore.isConnected
  })

  const query = useQuery({
    queryKey: ['UserSubPosition'],
    queryFn: () => getFn(params),
    enabled,
    retry: 1,
  })
  return query
}
