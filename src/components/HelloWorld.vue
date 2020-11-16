<script>
import { VButton, VProgress, VTag, VInput, VTextarea, VSelect, VFile, VDropdown, VDropdownItem } from '@pathscale/vue3-ui'

export default {
  name: 'HelloWord',
  components: { VButton, VProgress, VTag, VInput, VTextarea, VSelect, VFile, VDropdown, VDropdownItem }
}
</script>

<template>
  <div class="container">
    <v-button class="mb-6" type="is-primary" rounded>
      Primary button
    </v-button>

    <v-progress class="mb-6" type="is-primary" />

    <v-tag class="mb-6" type="is-primary" size="is-large" closable>
      Primary tag
    </v-tag>

    <v-input class="mb-6" color="is-primary" placeholder="Primary input" />

    <v-textarea class="mb-6" color="is-primary" placeholder="Primary placeholder" />

    <v-select class="mb-6" color="is-primary" placeholder="Primary select" size="is-normal">
      <option>Select dropdown</option>
      <option>With options</option>
    </v-select>

    <v-file class="mb-6" has-name color="is-primary">
      <template #label>
        Primary file input
      </template>
      <template #fileName>
        File Name
      </template>
    </v-file>

    <v-dropdown class="mb-6">
      <template #trigger>
        <v-button type="is-primary">
          Primary dropdown
        </v-button>
      </template>
      <v-dropdown-item> Blue </v-dropdown-item>
      <v-dropdown-item> Green </v-dropdown-item>
    </v-dropdown>
  </div>
</template>
