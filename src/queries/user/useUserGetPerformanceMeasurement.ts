import { useQuery } from '@tanstack/vue-query'
import { ref, watchEffect } from 'vue'
import { api } from '~/api'
import type {
  UserGetPerformanceMeasurementParams as ApiParams,
  UserGetPerformanceMeasurementResponse,
} from '~/models/user'
import { useGlobalStore } from '~/store'

interface ApiResponse extends UserGetPerformanceMeasurementResponse {
  datetime: number
}

const getFn = async () => {
  const response = await api.app.UserGetPerformanceMeasurement<ApiResponse, ApiParams>()
  const lastUpdatedAt = Date.now()

  return {
    data: response.params.data,
    datetime: lastUpdatedAt,
  }
}

export const useUserGetPerformanceMeasurement = () => {
  const globalStore = useGlobalStore()
  const enabled = ref(false)

  watchEffect(() => {
    enabled.value = globalStore.isConnected
  })

  const query = useQuery({
    queryKey: ['UserGetPerformanceMeasurement'],
    queryFn: () => getFn(),
    retry: 1,
    enabled: enabled,
    refetchInterval: 3000,
  })
  return query
}
