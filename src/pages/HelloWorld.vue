<script lang="ts">
import { defineComponent, reactive } from 'vue'
import { VImage, VButton } from '@pathscale/vue3-ui'
import { Greeting } from '../types'

export default defineComponent({
  name: 'HelloWord',
  components: { VImage, VButton },
  setup() {
    const greeting = reactive < Greeting > ({
      message: 'Welcome to Your Vue3-ui App',
    })
    return { greeting }
  },
})
</script>

<template>
  <section class="section has-text-centered">
    <v-image centered src="https://vue3.dev/vue3-ui-logo.png" size="is-128x128" />
    <h1 class="title">{{ greeting.message }}</h1>
    <p class="my-3">
      For a guide and recipes on how to use our UI Components,<br />
      check out the:
    </p>

    <br />

    <v-button
      type="is-primary"
      rounded
      tag="a"
      href="https://vue3.dev/"
      target="_blank"
      rel="noopener">
      Vue3-ui documentation
    </v-button>
  </section>
</template>
