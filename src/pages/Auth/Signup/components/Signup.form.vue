<script lang="ts" setup>

function onSubmit() {
// sign up
}

</script>

<template>
  <form ref="formRef" @submit.prevent="onSubmit">
    <v-field label="Email" type="is-danger">
      <v-input type="email" name="email" autocomplete="email" placeholder="Email Address" />
    </v-field>

    <v-field label="Username" type="is-danger">
      <v-input name="username" autocomplete="username" placeholder="Username" />
    </v-field>



    <v-field label="Password" type="is-danger">
      <v-input placeholder="Password" type="password" autocomplete="password"
               password-reveal
      />
    </v-field>

    <v-field label="Confirm Password" type="is-danger">
      <v-input name="confirmPassword" type="password" placeholder="Confirm your password"
        autocomplete="confirm-password" password-reveal
      />
    </v-field>


    <v-field>
      <v-checkbox required>
        <span class="ml-2">
          Terms & Conditions
        </span>
      </v-checkbox>
    </v-field>

    <v-button size="is-medium" expanded class="disabled my-5 is-capitalized" :loading="signup.isPending.value"
              type="is-primary" native-type="submit" :disabled="form.$anyInvalid"
    >
      Sign Up Account
    </v-button>

  </form>
</template>



