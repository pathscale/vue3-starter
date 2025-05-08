<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  const userToken = localStorage.getItem('userToken')
  if (userToken) {
    router.push({
      name: 'dashboardHome'
    })
  }
})

</script>

<template>
  <custom-header />
  <div class="container-fluid is-flex is-flex-1 is-flex-direction-column" style="margin-top: 5rem;">
    <router-view />
  </div>
  <custom-footer />
</template>

