<script lang="ts" setup>
import LoginForm from "./components/Login.form.vue";
</script>

<template>
  <div class="is-flex is-justify-content-center is-flex-direction-column is-align-items-center py-6">
    <div class="title py-2">
      Hello
    </div>
    <div class="subtitle">
      Welcome to the CeFi
    </div>
  </div>
  <login-form />
  <div class="has-text-right">
    <router-link :to="{ name: 'forgotPassword' }">Forgot Password?</router-link>
  </div>
  <hr />
  <div class="has-text-centered">
    <span> Don't have an account yet? </span>
    <router-link :to="{ name: 'signup' }">Create Account</router-link>
  </div>
</template>
