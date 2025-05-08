<script lang="ts" setup>
import { defineProps, defineEmits, computed } from 'vue'
const props = defineProps({
  title: String,
  modelValue: {
    type: Boolean,
    default: false
  },

  footer: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['update:modelValue'])
const visible = computed(() => props.modelValue)
const onClose = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <div :class="`modal is-active ${!visible ? 'is-hidden' : ''}`">
    <div @click="onClose" class="modal-background" />
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ title }}</p>
        <button @click="onClose" class="delete" aria-label="close" />
      </header>
      <section class="modal-card-body">
        <slot />
      </section>
      <footer v-if="footer" class="modal-card-foot is-flex is-justify-content-flex-end">
        <slot name="actions" />
      </footer>
    </div>
  </div>
</template>
