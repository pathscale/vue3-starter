<script>
import { computed, reactive, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import authStore, { login } from '~/store/modules/auth'

export default {
  name: 'Login',
  setup() {
    const state = reactive({
      username: process.env.VUE_APP_USERNAME,
      password: process.env.VUE_APP_PASSWORD,
      organizationName: '',
      error: null,
      msg: null,
      tab: 0,
      tos: false,
      privacy: false,
    })

    watch(
      () => state.tab,
      () => {
        state.error = null
        state.msg = null
      },
    )

    const router = useRouter()

    function validate() {
      if (state.password.length < 8) {
        state.msg = 'password is too short'
      }
      if (state.username.length < 8) {
        state.msg = 'username is too short'
      }
      return state.msg === null
    }

    async function onSubmit() {
      state.error = null
      state.msg = null

      if (!validate()) { return }

      try {
        if (state.tab === 0) {
          await login({ username: state.username, password: state.password })
        } else if (state.tab === 1) {
          console.log('Register')
        }
      } catch (error) {
        state.error = error
      }
    }

    watchEffect(() => {
      if (authStore.logged) { router.push({ name: 'home' }) }
    })

    const isLogin = computed(() => {
      return authStore.loading.login
    })

    return { state, onSubmit, authStore, isLogin }
  },
}
</script>

<template>
  <div class="px-4">
    <v-columns hcentered class="pt-6">
      <v-column narrow>
        <h1 class="title is-1 has-text-centered has-text-weight-medium">
          Vue3-ui
        </h1>
        <form @submit.prevent="onSubmit" class="box">
          <v-tabs v-model="state.tab" position="is-centered" class="pb-4">
            <v-tab label="Login" :disabled="authStore.loading['login']" />
            <v-tab label="Register" :disabled="authStore.loading['register']" />
          </v-tabs>

          <v-field label="username">
            <v-input placeholder="username" v-model="state.username" required autofocus />
          </v-field>

          <v-field label="password">
            <v-input placeholder="password" type="password" v-model="state.password" required />
          </v-field>

          <v-field v-if="state.tab">
            <v-checkbox v-model="state.tos" required>
              I accept terms of service
            </v-checkbox>
          </v-field>

          <v-field v-if="state.tab">
            <v-checkbox v-model="state.privacy" required>
              I accept privacy policies
            </v-checkbox>
          </v-field>

          <p v-if="state.msg" class="notification is-info is-light">
            {{ state.msg }}
          </p>

          <div class="notification is-danger is-light" v-if="state.error">
            {{ state.error }}
          </div>

          <v-button
            v-if="state.tab"
            :loading="authStore.loading['register']"
            type="is-primary"
            native-type="submit">
            Register
          </v-button>
          <v-button v-else :loading="isLogin" type="is-primary" native-type="submit">
            Login
          </v-button>
        </form>
      </v-column>
    </v-columns>
  </div>
</template>
