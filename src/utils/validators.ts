import type { Ref } from 'vue'


export const emailValidation = {}

export const usernameValidation = {}

export const required = (value: unknown) => Boolean(value) || value === 0

export const useRequired = <T>(value: T) => ({

})

export const useGreaterThan = (value: number, greater = 0, equal = false) => ({

})

export const useEmail = (email: string | null = '') => ({

})

export const usePassword = (password = '') => ({
})

export const usePasswordRef = (passwordRef: Ref<string> | undefined) => ({
})

export const useTOS = {}

export const useUsername = (username = '') => ({})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useErrorMessage = (form: Record<string, any>) => (field: string) => {
  return {}
}
