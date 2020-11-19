<script>
import { useState } from "@pathscale/appstate-fast";
import { watchEffect } from "vue";

/* Mutating A triggers B side effects which is incorrect (main issue) */
export default {
  name: "AppStateTest",
  setup() {
    const state = useState({ a: 1, b: 2 });
    watchEffect(() => {
      console.log(
        "b was updated incorrectly [only should run once]",
        state.b.value
      );
    });
    setInterval(() => {
      state.a.set((p) => p + 1);
    }, 1000);
    return { state };
  },
};
</script>

<template>
  <h1 class="title is-1">
    {{ state.a }}
  </h1>
</template>
