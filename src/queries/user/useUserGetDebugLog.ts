import { useQuery } from '@tanstack/vue-query'
import { ref, watchEffect } from 'vue'
import { api } from '~/api'
import type {
  UserGetDebugLogParams as ApiParams,
  UserGetDebugLogResponse as ApiResponse,
} from '~/models/user'
import { useGlobalStore } from '~/store'

const getFn = async () => {
  const response = await api.app.UserGetDebugLog<ApiResponse, ApiParams>()
  return response.params
}

export const useUserGetDebugLog = () => {
  const globalStore = useGlobalStore()
  const enabled = ref(false)

  watchEffect(() => {
    enabled.value = globalStore.isConnected
  })

  const query = useQuery({
    queryKey: ['UserGetDebugLog'],
    queryFn: () => getFn(),
    retry: 1,
    enabled: enabled,
    refetchInterval: 3000,
  })
  return query
}
