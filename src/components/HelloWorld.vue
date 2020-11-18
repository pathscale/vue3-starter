<script>
import { reactive, watchEffect } from 'vue'

export default {
  name: 'HelloWord',
  setup() {
    const state = reactive({ a: 1 })

    setInterval(() => {
      state.a += 1
    }, 3000)

    watchEffect(() => {
      console.log('changed ', state.a)
    })

    return { state }
  }
}
</script>

<template>
  <h1 class="title is-1">
    {{ state.a }}
  </h1>
</template>
