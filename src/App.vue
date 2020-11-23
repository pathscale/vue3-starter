<script>
import {
  watch
} from 'vue'
import { useState } from '@pathscale/appstate-fast'

export default {
  name: 'App',
  setup: () => {
    const state = useState({ foo: 1, bar: 1 })

    watch(() => state.foo.get(), () => {
      console.log('state.foo changed to', state.foo.get())
    })

    watch(() => state.bar.get(), () => {
      console.log('state.bar changed to', state.bar.get())
    })

    const increment = substate => state[substate].set(p => p + 1)

    return { state, increment }
  }
}
</script>

<template>
  <div class="container py-6 px-6">
    <h1 class="title is-1">
      Effect test
    </h1>

    <div class="buttons">
      <button class="button is-info" @click="increment('foo')">
        foo += 1
      </button>
      <button class="button is-warning" @click="increment('bar')">
        bar += 1
      </button>
    </div>

    <p>
      foo is {{ state.foo }} and bar is {{ state.bar }}
    </p>
  </div>
</template>
