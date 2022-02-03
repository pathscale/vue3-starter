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
  <v-columns hcentered gapless vcentered>
    <v-column class="image is-5-tablet is-3-desktop">
      <div class="section">
        <h1 class="title is-3 has-text-centered">Login</h1>
        <login-form class="box" />
      </div>
    </v-column>
  </v-columns>
</template>



