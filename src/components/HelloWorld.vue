<script>

// import { VButton } from "@pathscale/vue3-ui" It does not work
import { VButton } from "@pathscale/vue3-ui/dist/bundle" // It works

export default {
  name: 'DevShowcaseButton',
  components: {
    VButton
  }
}
</script>

<template>
  <section>
    <div class="buttons">
      <v-button type="is-primary">
        Primary
      </v-button>
      <v-button type="is-success">
        Success
      </v-button>
      <v-button type="is-danger">
        Danger
      </v-button>
      <v-button type="is-warning">
        Warning
      </v-button>
      <v-button type="is-info">
        Info
      </v-button>
      <v-button type="is-link">
        Link
      </v-button>
      <v-button type="is-light">
        Light
      </v-button>
      <v-button type="is-dark">
        Dark
      </v-button>
      <v-button type="is-text">
        Text
      </v-button>
    </div>

    <div class="buttons">
      <v-button disabled>
        Disabled
      </v-button>
      <v-button loading>
        Loading
      </v-button>
      <v-button rounded>
        Rounded
      </v-button>
    </div>

    <div class="buttons">
      <v-button type="is-primary" outlined>
        Outlined
      </v-button>
      <v-button type="is-success" outlined>
        Outlined
      </v-button>
      <v-button type="is-danger" outlined>
        Outlined
      </v-button>
      <v-button type="is-warning" outlined>
        Outlined
      </v-button>
    </div>

    <div class="buttons">
      <v-button type="is-primary" expanded>
        Expanded
      </v-button>
    </div>

    <div class="notification is-primary">
      <div class="buttons">
        <v-button type="is-primary" inverted>
          Inverted
        </v-button>
        <v-button type="is-primary" inverted outlined>
          Invert Outlined
        </v-button>
      </div>
    </div>

    <div class="buttons">
      <v-button size="is-small">
        Small
      </v-button>
      <v-button>Default</v-button>
      <v-button size="is-medium">
        Medium
      </v-button>
      <v-button size="is-large">
        Large
      </v-button>
    </div>
  </section>
</template>