import { toRef } from 'vue'
import authStore, { login as signIn, logout } from '~/store/modules/auth.module'

const useLogin = () => {
  const login = (payload: { username: string; password: string }) => {
    signIn(payload)
  }
  return {
    login,
    logout,
    loading: toRef(authStore.loading, 'login'),
    error: toRef(authStore.error, 'login'),
  }
}

export default useLogin
