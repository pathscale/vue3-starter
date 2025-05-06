import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from '~/api'
import { $toast } from '~/main'
import type {
  UserStartServiceParams as ApiParams,
  UserStartServiceResponse as ApiResponse,
} from '~/models/user'

const mutationFn = async (payload: ApiParams) => {
  const response = await api.app.UserStartService<ApiResponse, ApiParams>(payload)
  return response.params
}

export const useUserStartService = () => {
  const mutation = useMutation({
    mutationFn,
    onSuccess: () => {
      $toast.success('Started')
    },
  })
  return mutation
}
