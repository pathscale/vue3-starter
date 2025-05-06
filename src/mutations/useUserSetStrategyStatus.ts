import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from '~/api'
import { $toast } from '~/main'
import type {
  UserSetStrategyStatusParams as ApiParams,
  UserSetStrategyStatusResponse as ApiResponse,
} from '~/models/user'

const mutationFn = async (payload: ApiParams) => {
  const response = await api.app.UserSetStrategyStatus<ApiResponse, ApiParams>(payload)
  return response.params
}

export const useUserSetStrategyStatus = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn,
    onSuccess: () => {
      $toast.info('Status Changed')
      queryClient.invalidateQueries({ queryKey: ['UserGetStrategyStatus'] })
    },
  })
  return mutation
}
