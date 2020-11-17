<script>
import { VButton, VProgress, VTag, VInput, VTextarea, VSelect, VFile, VDropdown, VDropdownItem } from '@pathscale/vue3-ui'

export default {
  name: 'HelloWord',
  components: { VButton, VProgress, VTag, VInput, VTextarea, VSelect, VFile, VDropdown, VDropdownItem }
}
</script>

<template>
  <div class="container">
    <h1 class="title is-1">
      primary
    </h1>

    <v-button class="mb-6" type="is-primary" rounded>
      primary button
    </v-button>

    <v-progress class="mb-6" type="is-primary" />

    <v-tag class="mb-6" type="is-primary" size="is-large" closable>
      primary tag
    </v-tag>

    <v-input class="mb-6" color="is-primary" placeholder="primary input" />

    <v-textarea class="mb-6" color="is-primary" placeholder="primary placeholder" />

    <v-select class="mb-6" color="is-primary" placeholder="primary select" size="is-normal">
      <option>Select dropdown</option>
      <option>With options</option>
    </v-select>

    <v-file class="mb-6" has-name color="is-primary">
      <template #label>
        primary file input
      </template>
      <template #fileName>
        File Name
      </template>
    </v-file>

    <v-dropdown class="mb-6">
      <template #trigger>
        <v-button type="is-primary">
          primary dropdown
        </v-button>
      </template>
      <v-dropdown-item> Blue </v-dropdown-item>
      <v-dropdown-item> Green </v-dropdown-item>
    </v-dropdown>

    <h1 class="title is-1">
      info
    </h1>

    <v-button class="mb-6" type="is-info" rounded>
      info button
    </v-button>

    <v-progress class="mb-6" type="is-info" />

    <v-tag class="mb-6" type="is-info" size="is-large" closable>
      info tag
    </v-tag>

    <v-input class="mb-6" color="is-info" placeholder="info input" />

    <v-textarea class="mb-6" color="is-info" placeholder="info placeholder" />

    <v-select class="mb-6" color="is-info" placeholder="info select" size="is-normal">
      <option>Select dropdown</option>
      <option>With options</option>
    </v-select>

    <v-file class="mb-6" has-name color="is-info">
      <template #label>
        info file input
      </template>
      <template #fileName>
        File Name
      </template>
    </v-file>

    <v-dropdown class="mb-6">
      <template #trigger>
        <v-button type="is-info">
          info dropdown
        </v-button>
      </template>
      <v-dropdown-item> Blue </v-dropdown-item>
      <v-dropdown-item> Green </v-dropdown-item>
    </v-dropdown>


    <h1 class="title is-1">
      success
    </h1>

    <v-button class="mb-6" type="is-success" rounded>
      success button
    </v-button>

    <v-progress class="mb-6" type="is-success" />

    <v-tag class="mb-6" type="is-success" size="is-large" closable>
      success tag
    </v-tag>

    <v-input class="mb-6" color="is-success" placeholder="success input" />

    <v-textarea class="mb-6" color="is-success" placeholder="success placeholder" />

    <v-select class="mb-6" color="is-success" placeholder="success select" size="is-normal">
      <option>Select dropdown</option>
      <option>With options</option>
    </v-select>

    <v-file class="mb-6" has-name color="is-success">
      <template #label>
        success file input
      </template>
      <template #fileName>
        File Name
      </template>
    </v-file>

    <v-dropdown class="mb-6">
      <template #trigger>
        <v-button type="is-success">
          success dropdown
        </v-button>
      </template>
      <v-dropdown-item> Blue </v-dropdown-item>
      <v-dropdown-item> Green </v-dropdown-item>
    </v-dropdown>


    <h1 class="title is-1">
      warning
    </h1>

    <v-button class="mb-6" type="is-warning" rounded>
      warning button
    </v-button>

    <v-progress class="mb-6" type="is-warning" />

    <v-tag class="mb-6" type="is-warning" size="is-large" closable>
      warning tag
    </v-tag>

    <v-input class="mb-6" color="is-warning" placeholder="warning input" />

    <v-textarea class="mb-6" color="is-warning" placeholder="warning placeholder" />

    <v-select class="mb-6" color="is-warning" placeholder="warning select" size="is-normal">
      <option>Select dropdown</option>
      <option>With options</option>
    </v-select>

    <v-file class="mb-6" has-name color="is-warning">
      <template #label>
        warning file input
      </template>
      <template #fileName>
        File Name
      </template>
    </v-file>

    <v-dropdown class="mb-6">
      <template #trigger>
        <v-button type="is-warning">
          warning dropdown
        </v-button>
      </template>
      <v-dropdown-item> Blue </v-dropdown-item>
      <v-dropdown-item> Green </v-dropdown-item>
    </v-dropdown>


    <h1 class="title is-1">
      danger
    </h1>

    <v-button class="mb-6" type="is-danger" rounded>
      danger button
    </v-button>

    <v-progress class="mb-6" type="is-danger" />

    <v-tag class="mb-6" type="is-danger" size="is-large" closable>
      danger tag
    </v-tag>

    <v-input class="mb-6" color="is-danger" placeholder="danger input" />

    <v-textarea class="mb-6" color="is-danger" placeholder="danger placeholder" />

    <v-select class="mb-6" color="is-danger" placeholder="danger select" size="is-normal">
      <option>Select dropdown</option>
      <option>With options</option>
    </v-select>

    <v-file class="mb-6" has-name color="is-danger">
      <template #label>
        danger file input
      </template>
      <template #fileName>
        File Name
      </template>
    </v-file>

    <v-dropdown class="mb-6">
      <template #trigger>
        <v-button type="is-danger">
          danger dropdown
        </v-button>
      </template>
      <v-dropdown-item> Blue </v-dropdown-item>
      <v-dropdown-item> Green </v-dropdown-item>
    </v-dropdown>
  </div>
</template>
