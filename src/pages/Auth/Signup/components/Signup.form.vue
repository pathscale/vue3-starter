<script lang="ts" setup>
import { ref, watch } from "vue";
import { useValidation } from "vue-composable";
import { useRoute, useRouter } from "vue-router";
import config from "~/config";
import { useLogin, useSignup } from "~/mutations";
import {
  useEmail,
  useErrorMessage,
  usePasswordRef,
  useRequired,
  useUsername,
} from "~/utils/validators";

const router = useRouter();
const route = useRoute();
const { login } = useLogin();
const signup = useSignup();
const passwordRef = ref(config.password!);
const form = useValidation({
  username: useUsername(config.username),
  email: useEmail(config.email),
  password: usePasswordRef(passwordRef),
  confirmPassword: {
    ...useRequired(config.password),
    match: {
      $validator(v: string) {
        return v === passwordRef.value;
      },
      $message: "Password don't match",
    },
  },
  agreedPrivacyAndTOS: useRequired(false),
});

const errorMessage = useErrorMessage(form);

function onSubmit() {
  signup.mutate({
    username: form.username.$value,
    password: form.password.$value!,
    email: encodeURIComponent(form.email.$value!),
    agreedPrivacy: true,
    agreedTos: true,
    phone: "",
    service: "User",
    deviceId: "24787297130491616",
    deviceOs: "android",
  });
}

watch([signup.isSuccess, login.isSuccess], () => {
  const redirect = route.query.redirect;
  router.push(
    (redirect as string) || {
      name: "dashboardHome",
    },
  );
});
</script>

<template>
  <form ref="formRef" @submit.prevent="onSubmit">
    <v-field :message="errorMessage('email')" label="Email" type="is-danger">
      <v-input type="email" name="email" autocomplete="email" placeholder="Email Address" v-model="form.email.$value" />
    </v-field>

    <v-field :message="errorMessage('username')" label="Username" type="is-danger">
      <v-input name="username" autocomplete="username" placeholder="Username" v-model="form.username.$value" />
    </v-field>



    <v-field :message="errorMessage('password')" label="Password" type="is-danger">
      <v-input placeholder="Password" type="password" v-model="form.password.$value" autocomplete="password"
               password-reveal
      />
    </v-field>

    <v-field :message="errorMessage('confirmPassword')" label="Confirm Password" type="is-danger">
      <v-input name="confirmPassword" type="password" placeholder="Confirm your password"
               v-model="form.confirmPassword.$value" autocomplete="confirm-password" password-reveal
      />
    </v-field>


    <v-field>
      <v-checkbox required v-model="form.agreedPrivacyAndTOS.$value">
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

    <v-field v-show="signup.error.value" :message="signup.error.value" type="is-danger" />
  </form>
</template>



