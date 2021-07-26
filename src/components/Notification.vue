<script>
import { ref, watch } from 'vue'
import { store } from '~/store/store'

export default {
  name: 'Notification',
  setup() {
    const show = ref(false)

    watch(
      () => store.notification,
      () => {
        show.value = true
        setTimeout(() => {
          show.value = false
        }, 2000)
      },
    )

    return { store, show }
  },
}
</script>

<template>
  <transition name="fade">
    <div v-show="show" class="notification is-danger">
      {{ store.notification }}
    </div>
  </transition>
</template>

<style scoped>
.notification {
  position: fixed;
  bottom: 2em;
  right: 2em;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
