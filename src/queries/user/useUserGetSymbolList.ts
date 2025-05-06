import { useQuery } from '@tanstack/vue-query'
import { ref, watchEffect } from 'vue'
import { api } from '~/api'
import {
  UserGetStrategyOneSymbolParams,
  UserGetStrategyOneSymbolResponse,
  UserGetSymbol2Params,
  UserGetSymbol2Response,
} from '~/models/user'

import { useGlobalStore } from '~/store'

interface ApiParams extends UserGetStrategyOneSymbolParams {
  strategyId: number
}

const getFn = async (params?: ApiParams) => {
  if (params?.strategyId === 1) {
    const response = await api.app.UserGetStrategyOneSymbol<
      UserGetStrategyOneSymbolResponse,
      UserGetStrategyOneSymbolParams
    >(params)
    return response.params.data.filter(e => e.flag).sort((a, b) => a.symbol.localeCompare(b.symbol))
  }

  if (params?.strategyId === 2) {
    const response = await api.app.UserGetSymbol2<UserGetSymbol2Response, UserGetSymbol2Params>(
      params,
    )
    return response.params.data.filter(e => e.flag).sort((a, b) => a.symbol.localeCompare(b.symbol))
  }

  return []
}

export const useUserGetSymbolList = (params?: ApiParams) => {
  const globalStore = useGlobalStore()
  const enabled = ref(false)
  watchEffect(() => {
    enabled.value = globalStore.isConnected
  })

  const query = useQuery({
    queryKey: ['UserGetSymbolList', params],
    queryFn: () => getFn(params),
    retry: 1,
    enabled,
  })
  return query
}
