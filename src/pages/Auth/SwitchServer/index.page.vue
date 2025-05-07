<script lang="ts" setup>
import { ref } from 'vue'
import { appServer } from '~/api/services/app.service'
const _appServer = ref(appServer)
const onSubmitAppServer = () => {
  localStorage.setItem('appServer', _appServer.value)
  window.location.reload()
}
</script>

<template>
  <div class="is-flex is-justify-content-center is-flex-direction-column is-align-items-center py-6">
    <div class="title py-2">
      Switch Server
    </div>
    <div class="subtitle">
      Set the Server URL
    </div>
  </div>
  <form @submit.prevent="onSubmitAppServer">
    <v-field label="Server URI">
      <v-input v-model="_appServer" required />
    </v-field>
    <v-button native-type="submit" type="is-black">Set</v-button>
  </form>
</template>
