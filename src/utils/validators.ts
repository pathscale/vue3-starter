import type { Ref } from 'vue'
import { ref } from 'vue'
import { numberPrecision } from './formatters'

type ValidationError = {
  $message: string;
  [key: string]: string; 
};

type FormField = {
  $dirty: boolean;
  $anyInvalid: boolean;
  $errors: ValidationError[];
};

export const emailValidation =
  /^(([^<>()\\[\].,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([a-zA-Z\-\d]+\.)+[a-zA-Z]{2,}))$/

export const usernameValidation = /^[\w-]{8,20}$/

export const required = (value: unknown) => Boolean(value) || value === 0

export const useRequired = <T>(value: T) => ({
  $value: ref<T>(value),
  required: {
    $validator: required,
    $message: 'This field is required',
  },
})

export const useGreaterThan = (value: number, greater = 0, equal = false) => ({
  $value: ref(value),
  required: {
    $validator: (value: number) => value > greater || (equal && value === greater),
    $message: `This value should be greather than ${numberPrecision(greater)}`,
  },
})

export const useEmail = (email: string | null = '') => ({
  $value: ref(email),
  required: {
    $validator: required,
    $message: 'Email field is required',
  },

  isValid: {
    $validator(v: string) {
      return emailValidation.test(v)
    },
    $message: 'Please enter valid email address',
  },
})

export const usePassword = (password = '') => ({
  $value: ref(password),
  required: {
    $validator: required,
    $message: 'Password field is required',
  },
  maximumLength: {
    $validator(v: string) {
      return v.length <= 32
    },
    $message: 'Password cannot be longer than 128 characters',
  },
  minimumLength: {
    $validator(v: string) {
      return v.length >= 8
    },
    $message: 'Password must be longer than 8 characters',
  },
})

export const usePasswordRef = (passwordRef: Ref<string> | undefined) => ({
  $value: passwordRef,
  required: {
    $validator: required,
    $message: 'Password field is required',
  },
  maximumLength: {
    $validator(v: string) {
      return v.length <= 32
    },
    $message: 'Password cannot be longer than 128 characters',
  },
  minimumLength: {
    $validator(v: string) {
      return v.length >= 8
    },
    $message: 'Password must be longer than 8 characters',
  },
})

export const useTOS = {
  $value: ref(true), // TODO: remove
  required: {
    $validator: required,
    $message: 'Please agree the Terms and Conditions',
  },
}

export const useUsername = (username = '') => ({
  $value: ref(username),
  required: {
    $validator: required,
    $message: ref('Username field is required'),
  },
  maximumLength: {
    $validator(v: string) {
      return v.length <= 20
    },
    $message: 'Username cannot be longer than 20 characters',
  },
  minimumLength: {
    $validator(v: string) {
      return v.length >= 4
    },
    $message: 'Username must be longer than 8 characters',
  },
  noSpaces: {
    $validator(v: string) {
      return !/\s/.test(v)
    },
    $message: 'Username cannot contain whitespace',
  },
  // isValid: {
  //   $validator(v: string) {
  //     return usernameValidation.test(v)
  //   },
  //   $message: 'Username must be an alphanumeric that may include _ and –',
  // },
})

export const useErrorMessage = (form: Record<string, FormField>) => (field: string) => {
  const error = form[field].$dirty && form[field].$anyInvalid ? form[field].$errors[0] : null
  return error
}
