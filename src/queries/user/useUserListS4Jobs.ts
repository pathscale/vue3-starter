import { useQuery } from '@tanstack/vue-query'
import type { ComputedRef } from 'vue'
import { ref, watchEffect } from 'vue'
import { api } from '~/api'
import type { UserListS4JobsParams, UserListS4JobsResponse } from '~/models/user'
import { useGlobalStore } from '~/store'

const getFn = async () => {
  const response = await api.app.UserListS4Jobs<UserListS4JobsResponse, UserListS4JobsParams>()
  return response.params
}

export const useUserListS4Jobs = () => {
  const globalStore = useGlobalStore()
  const enabled = ref(false)

  watchEffect(() => {
    enabled.value = globalStore.isConnected
  })

  const query = useQuery({
    queryKey: ['UserListS4Jobs'],
    queryFn: () => getFn(),
    retry: 1,
    enabled: enabled,
    refetchInterval: 3000,
  })
  return query
}
