<script lang="ts" setup>
const onSubmitAppServer = () => {
  window.location.reload();
};
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
      <v-input required />
    </v-field>
    <v-button native-type="submit" type="is-black">Set</v-button>
  </form>
</template>
