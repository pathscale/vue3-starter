<script lang="ts" setup>

function onSubmit() {
}
</script>

<template>
  <div class="is-flex is-justify-content-center is-flex-direction-column is-align-items-center py-6">
    <div class="title py-2">
      Forgot Password
    </div>
    <div class="subtitle">
      Forgot Password?
    </div>
  </div>

  <div class="has-text-centered mt-6 mb-5">
    Please enter your email address. We will send you an email to reset your password.
  </div>
  <form @submit.prevent="onSubmit">
    <v-field class="pb-2" type="is-danger">
      <v-input type="email" name="email" autocomplete="email" placeholder="Enter your email" />
    </v-field>
    <v-button size="is-medium" expanded class="my-5 is-capitalized" type="is-primary"
      native-type="submit" >
      Submit
    </v-button>
  </form>
  <div class="has-text-right">
    <span> Don't have an account yet? </span>
    <router-link :to="{ name: 'signup' }">Create Account</router-link>
  </div>
  <hr />
  <div class="mr-2 has-text-centered">
    Forget it, send me back to the <router-link :to="{ name: 'login' }">Login</router-link>
  </div>
</template>
