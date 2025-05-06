import { useQuery } from '@tanstack/vue-query'
import { ref, watchEffect } from 'vue'
import { api } from '~/api'
import { queryClient } from '~/main'
import type {
  SubS3TerminalBestAskBestBidParams as ApiParams,
  SubS3TerminalBestAskBestBidResponse as StreamResponse,
} from '~/models/user'

import { useGlobalStore } from '~/store'

interface ApiResponse {
  data: StreamResponse
  lastUpdatedAt: number
}

const getFn = async (params?: ApiParams) => {
  await api.app.SubS3TerminalBestAskBestBid<ApiResponse, ApiParams>(params)
  return { data: [] }
}

export const unsubscribeSubS3TerminalBestAskBestBid = (params?: ApiParams) => getFn(params)

export const updateSubS3TerminalBestAskBestBid = (payload: StreamResponse) => {
  if (payload && Object.keys(payload).length) {
    const lastUpdatedAt = Date.now()

    if (payload?.length) {
      queryClient.setQueryData(['SubS3TerminalBestAskBestBid'], {
        data: payload,
        lastUpdatedAt,
      })
    }
  }
}

export const useSubS3TerminalBestAskBestBid = (params: ApiParams) => {
  const globalStore = useGlobalStore()
  const enabled = ref(false)

  watchEffect(() => {
    enabled.value = globalStore.isConnected
  })

  const query = useQuery({
    queryKey: ['SubS3TerminalBestAskBestBid'],
    queryFn: () => getFn(params),
    enabled,
    retry: 1,
  })
  return query
}
