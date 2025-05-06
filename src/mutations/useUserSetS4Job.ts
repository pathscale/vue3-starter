import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from '~/api'
import type { UserSetS4JobParams as ApiParams } from '~/models/user'

const mutateFn = async (params: ApiParams) => {
  await api.app.UserSetS4Job<void, ApiParams>(params)
}

export const useUserSetS4Job = () => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: mutateFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['UserListS4Jobs'],
      })
    },
  })
  return mutation
}
