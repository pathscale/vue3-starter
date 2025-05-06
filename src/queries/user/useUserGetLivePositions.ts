import { useQuery } from '@tanstack/vue-query'
import { ref, watchEffect } from 'vue'
import { api } from '~/api'
import type {
  UserGetLivePositionsParams as ApiParams,
  UserGetLivePositionsResponse as ApiResponse,
} from '~/models/user'
import { useGlobalStore } from '~/store'

const getFn = async () => {
  const response = await api.app.UserGetLivePositions<ApiResponse, ApiParams>()
  return response.params
}

export const useUserGetLivePositions = () => {
  const globalStore = useGlobalStore()
  const enabled = ref(false)

  watchEffect(() => {
    enabled.value = globalStore.isConnected
  })

  const query = useQuery({
    queryKey: ['UserGetLivePositions'],
    queryFn: () => getFn(),
    retry: 1,
    enabled: enabled,
    refetchInterval: 3000,
  })
  return query
}
