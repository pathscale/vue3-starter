/* eslint-disable unicorn/no-unsafe-regex -- ignore */
import { ref } from 'vue'

export const emailValidation =
  /^(([^<>()\\[\].,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([a-zA-Z\-\d]+\.)+[a-zA-Z]{2,}))$/

export const required = x => Boolean(x)

export const useEmail = {
  $value: ref(process.env.VUE_APP_USERNAME + '@test.com'), // TODO: remove
  required: {
    $validator: required,
    $message: ref('Email field is required'),
  },

  isValid: {
    $validator(v) {
      return emailValidation.test(v)
    },
    $message: 'Please enter valid email address',
  },
}

export const usePassword = {
  $value: ref(process.env.VUE_APP_PASSWORD || ''), // TODO: remove
  required: {
    $validator: required,
    $message: ref('Password field is required'),
  },
  maximumLength: {
    $validator(v) {
      return v.length <= 32
    },
    $message: 'Password cannot be longer than 128 characters',
  },
  minimumLength: {
    $validator(v) {
      return v.length >= 8
    },
    $message: 'Password must be longer than 8 characters',
  },
}

export const useTOS = {
  $value: ref(true), // TODO: remove
  required: {
    $validator: required,
    $message: ref('Please agree the Terms and Conditions'),
  },
}

export const useErrorMessage = form => field =>
  form[field].$dirty && form[field].$anyInvalid ? form[field].$errors[0] : null
