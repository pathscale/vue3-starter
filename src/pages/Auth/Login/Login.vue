<script>
import { watchEffect, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import authStore from '~/store/modules/auth.module'

import LoginForm from './components/LoginForm.vue'

export default {
  name: 'Login',
  components: { LoginForm },
  setup() {
    const router = useRouter()
    const message = ref('Waiting for Rust...')

    invoke('my_custom_command')

    watchEffect(() => {
      if (authStore.logged) router.push({ name: 'wallet' })
    })

    onMounted(async() => {
      await listen('backend-event', event => {
        message.value = event.payload
      })
    })


    return {
      message
    }
  },
}
</script>

<template>
  <v-columns hcentered gapless vcentered>
    <v-column class="image is-5-tablet is-3-desktop">
      <p>{{ message }}</p>
      <div class="section">
        <h1 class="title is-3 has-text-centered">Login</h1>
        <login-form class="box" />
      </div>
    </v-column>
  </v-columns>
</template>



