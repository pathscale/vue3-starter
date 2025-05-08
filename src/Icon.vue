<script lang="ts">
import { VIcon } from "@pathscale/vue3-ui";
import config from "~/config";

export default {
  name: "Icon",
  components: { VIcon },
  inheritAttrs: false,
  setup(props) {
    const bundle = "icons";
    return { version: config.version, bundle };
  },
};
</script>

<template>
  <v-icon :cache-version="version" :bundle="bundle" v-bind="$attrs" />
</template>
