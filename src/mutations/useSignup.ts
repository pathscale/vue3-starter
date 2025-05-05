import { useMutation } from '@tanstack/vue-query'
import { service } from '~/api'
import type { LoginParams, SignupParams, SignupResponse } from '~/models/auth'
import { useLogin } from './useLogin'
import md5 from 'md5'

interface ISignup extends SignupParams, LoginParams {}

const useSignup = () => {
  const { login } = useLogin()
  const mutation = useMutation({
    mutationFn: async (payload: ISignup) => {
      let { password } = payload
      password = md5('md5' + payload.username + password) as string
      const params = [
        '0signup',
        '1' + payload.username,
        '2' + password,
        '3' + payload.email,
        '4' + payload.phone,
        '5' + 'true',
        '6' + 'true',
      ]

      await service.auth.connect<SignupResponse>(params)
      // auto login after signup
      await login.mutateAsync(payload)
    },
  })
  return mutation
}

export { useSignup }
