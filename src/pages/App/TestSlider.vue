<script setup>
import { ref } from 'vue'
import { VSlider } from '@pathscale/vue3-ui'

const value = ref(30)
</script>

<template>
  <div class="p-6 space-y-6">
    <h1 class="text-xl font-bold">Test Slider</h1>

    <div>
      <p class="font-medium">Default</p>
      <VSlider v-model="value" />
    </div>

    <div>
      <p class="font-medium text-success-600">Success</p>
      <VSlider v-model="value" type="is-success" />
    </div>

    <div>
      <p class="font-medium text-warning-600">Warning</p>
      <VSlider v-model="value" type="is-warning" />
    </div>

    <div>
      <p class="font-medium text-danger-600">Danger</p>
      <VSlider v-model="value" type="is-danger" />
    </div>

    <div>
      <p class="font-medium text-info-600">Info</p>
      <VSlider v-model="value" type="is-info" />
    </div>

    <div>
      <p>Valor actual: {{ value }}</p>
    </div>
  </div>
</template>
