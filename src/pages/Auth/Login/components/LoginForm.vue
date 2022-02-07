<script lang="ts">
import { useValidation } from 'vue-composable'
import { useEmail, usePassword, useTOS, useErrorMessage } from '~/utils/validators'
import useLogin from '../hooks/useLogin'

export default {
  name: 'Login',
  setup() {
    const { login, loading, error } = useLogin()

    const form = useValidation({
      email: useEmail,
      password: usePassword,
      tos: useTOS,
    })

    const errorMessage = useErrorMessage(form)

    function onSubmit() {
      login({
        username: form.email.$value,
        password: form.password.$value,
      })
    }

    return { onSubmit, errorMessage, form, loading, error }
  },
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <v-field v-if="error" :message="error" type="is-danger">
      <v-input placeholder="Email address" v-model="form.email.$value" autofocus />
    </v-field>

    <v-field :message="errorMessage('email')" type="is-danger">
      <v-input placeholder="Email address" v-model="form.email.$value" autofocus />
    </v-field>

    <v-field :message="errorMessage('password')" type="is-danger">
      <v-input placeholder="Password" type="password" v-model="form.password.$value" />
    </v-field>

    <v-field class="is-flex is-justify-content-right">
      <a href="#/auth/forgot-password" class="">Forgot password?</a>
    </v-field>

    <v-field :message="errorMessage('tos')" type="is-danger">
      <v-checkbox v-model="form.tos.$value">
        <span class="ml-2">We/I agree to be bound by the terms set out in the
          <a target="_blank" rel="noopener noreferrer">Terms of Use</a>,
          <a target="_blank" rel="noopener noreferrer">Privacy Policy</a>
        </span>
      </v-checkbox>
    </v-field>

    <v-button
      size="is-medium"
      expanded
      class="disabled my-6"
      :loading="loading"
      type="is-primary"
      native-type="submit"
      :disabled="form.$anyInvalid">
      Login
    </v-button>

    <v-field class="is-flex is-justify-content-center">
      <p class="is-small">New user? <a> Sign up </a></p>
    </v-field>
  </form>
</template>



