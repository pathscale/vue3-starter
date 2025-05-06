<script lang="ts" setup>
import { useRouter } from "vue-router";

const router = useRouter();

function onSubmit() {
  router.push("/home");
}

</script>

<template>
  <form @submit.prevent="onSubmit">
    <v-field label="Username" type="is-danger">
      <v-input name="username" autocomplete="username" placeholder="Dev0" autofocus />
    </v-field>

    <v-field label="Password" type="is-danger">
      <v-input placeholder="123456" type="password" password-reveal />
    </v-field>

    <v-field>
      <v-checkbox>
        <span class="ml-1"> Remember my login </span>
      </v-checkbox>
    </v-field>
    <v-button size="is-medium" expanded class="my-5 is-capitalized" type="is-primary"
      native-type="submit">
      Login
    </v-button>
  </form>
</template>
