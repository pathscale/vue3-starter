import { toRef } from 'vue'
import authStore, { login as signIn } from '~/store/modules/auth'

const useLogin = () => {
  const login = (payload: { username: string; password: string }) => {
    signIn(payload)
  }
  return {
    login,
    loading: toRef(authStore.loading, 'login'),
    error: toRef(authStore.error, 'login'),
  }
}

export default useLogin
