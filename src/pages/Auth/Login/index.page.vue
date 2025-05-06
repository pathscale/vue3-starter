<script lang="ts" setup>
import { useValidation } from 'vue-composable'
import { useUsername, usePassword, useErrorMessage } from '~/utils/validators'
import { useRoute, useRouter } from 'vue-router'

import { useLogin } from '~/mutations'
import { ref, watch } from 'vue'
import config from '~/config'

const router = useRouter()
const route = useRoute()
const { login } = useLogin()

const { isPending, error } = login

const form = useValidation({
  username: useUsername(config.username),
  password: usePassword(config.password),
  remember: {
    $value: ref(true),
  },
})

const errorMessage = useErrorMessage(form)

function onSubmit() {
  login.mutate({
    username: form.username.$value,
    password: form.password.$value,
    service: 'User',
    deviceId: '24787297130491616',
    deviceOs: 'android',
  })
}

watch([login.isSuccess], () => {
  const redirect = route.query.redirect
  router.push((redirect as string) || {
    name: 'dashboardHome'
  })
})

</script>

<template>
  <form @submit.prevent="onSubmit">
    <v-field :message="errorMessage('username')" label="Username" type="is-danger">
      <v-input name="username" autocomplete="username" placeholder="Enter Your Username" v-model="form.username.$value"
        autofocus />
    </v-field>

    <v-field :message="errorMessage('password')" label="Password" type="is-danger">
      <v-input placeholder="Enter Your Password" type="password" v-model="form.password.$value" password-reveal />
    </v-field>

    <v-field>
      <v-checkbox v-model="form.remember.$value">
        <span class="ml-1"> Remember my login </span>
      </v-checkbox>
    </v-field>
    <v-button size="is-medium" expanded class="my-5 is-capitalized" :loading="isPending" type="is-primary"
      native-type="submit" :disabled="form.$anyInvalid">
      Login
    </v-button>
    <v-field v-show="error" :message="error" type="is-danger" />
  </form>
</template>
