<script>
import { watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import authStore from '~/store/modules/auth'

import LoginForm from './components/LoginForm.vue'

export default {
  name: 'Login',
  components: { LoginForm },
  setup() {
    const router = useRouter()

    watchEffect(() => {
      if (authStore.logged) router.push({ name: 'wallet' })
    })
  },
}
</script>

<template>
  <v-columns hcentered gapless class="my-0" vcentered>
    <v-column class="auth-banner is-hidden-touch" />
    <v-column size="is-2" />
    <v-column size="is-4">
      <div class="section">
        <h1 class="title is-3 has-text-centered">Login</h1>
        <login-form />
      </div>
    </v-column>
    <v-column size="is-2" />
  </v-columns>
</template>


<style>
.auth-banner {
  background-image: url('../../../assets/background/bg-auth-office.png');
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  height: 100vh;
}
</style>
