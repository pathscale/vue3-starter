<script lang="ts" setup>
import { useValidation } from "vue-composable";

import { useEmail, useErrorMessage } from "~/utils/validators";
const form = useValidation({
  email: useEmail(),
});

const errorMessage = useErrorMessage(form);

function onSubmit() {
  const data = {
    email: form.email.$value,
  };

  console.log(data);
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
    <v-field class="pb-2" :message="errorMessage('email')" type="is-danger">
      <v-input type="email" name="email" autocomplete="email" placeholder="Enter your email"
        v-model="form.email.$value" />
    </v-field>
    <v-button size="is-medium" expanded class="my-5 is-capitalized" :loading="loading" type="is-primary"
      native-type="submit" :disabled="form.$anyInvalid">
      Submit
    </v-button>
    <v-field v-show="error" :message="error" type="is-danger" />
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
