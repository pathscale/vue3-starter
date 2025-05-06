<script lang="ts" setup>
import { useValidation } from 'vue-composable'
import { useUsername, usePassword } from '~/utils/validators'
import { useRoute, useRouter } from 'vue-router'

import { useLogin } from '~/mutations'
import { ref, watch } from 'vue'
import config from '~/config'

const router = useRouter()
const route = useRoute()
const { login } = useLogin()

const form = useValidation({
  username: useUsername(config.username),
  password: usePassword(config.password),
  remember: {
    $value: ref(true),
  },
})
const usernameTest = "dev0"

const passwordTest = "12345678"

function onSubmit() {
  router.push("/home");
}


watch([login], () => {
  const redirect = route.query.redirect
  router.push((redirect as string) || {
    name: 'dashboardHome'
  })
})

</script>

<template>
  <form @submit.prevent="onSubmit">
    <v-field label="Username" type="is-danger">
      <v-input name="username" autocomplete="username" placeholder="Enter Your Username" v-model="usernameTest"
        autofocus />
    </v-field>

    <v-field label="Password" type="is-danger">
      <v-input placeholder="Enter Your Password" type="password" v-model="passwordTest" password-reveal />
    </v-field>

    <v-field>
      <v-checkbox v-model="form.remember.$value">
        <span class="ml-1"> Remember my login </span>
      </v-checkbox>
    </v-field>
    <v-button size="is-medium" expanded class="my-5 is-capitalized" type="is-primary"
      native-type="submit" :disabled="form.$anyInvalid">
      Login
    </v-button>
    <v-field type="is-danger" />
  </form>
</template>
