
<script lang="ts" setup>
import config from "~/config";

defineProps({
  showBuildVersionOnly: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <footer class="mt-3">
    <template v-if="!showBuildVersionOnly">
      <div class="container level px-6">
        <div class="level-left">
          <div>
            <img src="https://alertred.pathscale.com/logo.svg" height="32" width="80" />
            <p class="mt-5 is-size-6">Experience the most innovative, decentralized crypto wealth management platform</p>
            <div class="level is-size-6 has-text-weight-semibold mt-5">
              <div>Home</div>
              <div>Whitepaper</div>
              <div>Terms & Conditions</div>
            </div>
          </div>
        </div>
        <div class="level-right">
          <div>
            <p>Subscribe to our newsletter</p>
            <v-field grouped class="mt-4">
              <v-input placeholder="Enter your email" />
              <v-button>Subscribe</v-button>
            </v-field>
          </div>
        </div>
      </div>
      <div class="container px-6">
        <hr />
      </div>

      <div class="container px-6 level" style="color: #667085; fill: #98a2b3;">
        <p>© 2023 MC² Finance. All rights reserved.</p>
        <div class="level-right gap-5">
          <icon name="twitter" />
          <icon name="linkedin" />
          <icon name="facebook" />
          <icon name="github" />
        </div>
      </div>
    </template>
    <p class="has-text-centered">Build v{{ config.version }}</p>
  </footer>
</template>

<style scoped>
.px-6 {
  padding-left: 2.5rem;
  padding-right: 2.5rem;
}

.mt-5 {
  margin-top: 2rem;
}

.level-left {
  max-width: 23rem;
}

.gap-5 {
  gap: 1.5rem;
}
</style>
