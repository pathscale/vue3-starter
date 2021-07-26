<template>
  <footer class="footer has-text-centered has-text-white">
    <p>Build v{{ process.env.VUE_APP_VERSION_NUMBER }}</p>
  </footer>
</template>

<style scoped>
.footer {
  position: absolute;
  bottom: 0;
}
</style>
