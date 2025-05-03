<script lang="ts" setup>
import SignupForm from "./components/Signup.form.vue";
</script>

<template>
  <div class="is-flex is-justify-content-center is-flex-direction-column is-align-items-center py-6">
    <div class="title py-2">
      Sign Up
    </div>
    <div class="subtitle">
      Create Your Account
    </div>
  </div>
  <signup-form />
  <hr />
  <div class="has-text-centered">
    <span> Already have an account? </span>
    <router-link :to="{ name: 'login' }">Login</router-link>
  </div>
</template>
