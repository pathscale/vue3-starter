<script lang="ts" setup>
import { reactive, toRaw, watch } from "vue";
import { useCssVariables } from "vue-composable";

function convertToObjectArray(obj: Record<string, string>) {
  return Object.entries(obj).map(([name, value]) => ({ name, value }));
}
const variables = reactive({
  "--navbar-background-color": "var(--blm-nav-color)",
  "--navbar-tab-active-color": "var(--blm-tabs-link-act-clr)",
  "--navbar-tab-link-color": "var(--blm-tabs-link-clr)",
  "--navbar-tab-hover-color": "var(--blm-tabs-link-hov-clr)",
  "--submenu1-background-color": "var(--blm-nav-color)",
  "--submenu1-tab-active-color": "var(--blm-tabs-link-act-clr)",
  "--submenu1-tab-link-color": "var(--blm-tabs-link-clr)",
  "--submenu1-tab-hover-color": "var(--blm-tabs-link-hov-clr)",
  "--submenu2-background-color": "var(--blm-nav-color)",
  "--submenu2-tab-active-color": "var(--blm-tabs-link-act-clr)",
  "--submenu2-tab-link-color": "var(--blm-tabs-link-clr)",
  "--submenu2-tab-hover-color": "var(--blm-tabs-link-hov-clr)",
  "--blm-bread-itm-clr": "#665eba",
  "--blm-bread-itm-hov-clr": "#fff",
  "--blm-bread-itm-act-clr": "var(--blm-prim)",
  "--blm-bread-itm-separator-clr": "#8a8c90",
  "--blm-table-bg-clr": "#121212",
  "--blm-table-cell-bd": "1px solid #141a35",
  "--blm-table-clr": "var(--blm-light)",
  "--blm-table-head-bg-clr": "#141a35",
  "--blm-table-head-cell-clr": "#665eba",
});

const regexPatterns = {
  navbar: /--navbar-/,
  submenu1: /--submenu1-/,
  submenu2: /--submenu2-/,
  blmBread: /--blm-bread-/,
  blmTable: /--blm-table-/,
};

function groupCSSVariables(variables: any): any {
  const grouped: any = {};
  for (const [key, value] of Object.entries(variables)) {
    for (const [group, regex] of Object.entries(regexPatterns)) {
      if (regex.test(key)) {
        if (grouped[group]) {
          grouped[group].push({ key, value });
        } else {
          grouped[group] = [{ key, value }];
        }
        break; // If a key matches one pattern, it should not be checked against others
      }
    }
  }
  return grouped;
}

const groupedVariables = groupCSSVariables(toRaw(variables));

watch(
  () => Object.values(variables),
  () => {
    // @ts-ignore
    useCssVariables(convertToObjectArray(toRaw(variables)));
  },
);
</script>

<template>
  <v-columns class="has-text-white section m-0 p-0" multiline v-for="e in Object.keys(regexPatterns)" :key="e">
    <v-column size="is-12" class="is-capitalized">
      <span class="subtitle has-text-primary">
        {{ e }}
      </span>
    </v-column>
    <v-column v-for="v in groupedVariables[e]" size="is-3" :key="v">

      <v-field :label="v.key">
        <v-input v-model="variables[v.key]" />
      </v-field>


    </v-column>
  </v-columns>
</template>
