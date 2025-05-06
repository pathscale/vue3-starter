import { useQuery } from '@tanstack/vue-query'
import { ref, watchEffect } from 'vue'
import { api } from '~/api'
import { queryClient } from '~/main'
import type {
  UserSubStrategy3PositionsClosingParams as ApiParams,
  UserSubStrategy3PositionsClosingResponse as StreamResponse,
} from '~/models/user'

import { useGlobalStore } from '~/store'

interface ApiResponse {
  data: StreamResponse
  lastUpdatedAt: number
}

const getFn = async (params?: ApiParams) => {
  const response = await api.app.UserSubStrategy3PositionsClosing<ApiResponse, ApiParams>(params)
  return { positions: response.params.data }
}

export const unsubscribeUserSubStrategy3PositionsClosing = () => getFn({ unsubscribe: true })

export const updateUserSubStrategy3PositionsClosing = (payload: StreamResponse) => {
  if (payload && Object.keys(payload)) {
    const lastUpdatedAt = Date.now()
    queryClient.setQueryData(['UserSubStrategy3PositionsClosing'], {
      positions: payload,
      lastUpdatedAt,
    })
  }
}

export const useUserSubStrategy3PositionsClosing = () => {
  const globalStore = useGlobalStore()
  const enabled = ref(false)

  watchEffect(() => {
    enabled.value = globalStore.isConnected
  })

  const query = useQuery({
    queryKey: ['UserSubStrategy3PositionsClosing'],
    queryFn: () => getFn(),
    enabled,
    retry: 1,
  })
  return query
}
