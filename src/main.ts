import { createApp } from 'vue'
import './Icons.vue'

import {
  VButton,
  VCheckbox,
  VField,
  VInput,
  VProgress,
  VSelect,
  VSidebar,
  VTextarea,
  VBreadcrumb,
  VBreadcrumbItem,
  VCard,
  VCardContent,
  VCardFooter,
  VCardFooterItem,
  VCardHeader,
  VCardImage,
  VColumn,
  VColumns,
  VMenu,
  VMenuItem,
  VMenuList,
  VNavbar,
  VNavbarBurger,
  VNavbarDropdown,
  VNavbarItem,
  VImage,
  VAccordion,
  VIcon,
  VTag,
  VTabs,
  VTab,
  VSwitch,
  VTable,
  VDropdown,
  VDropdownItem,
} from '@pathscale/vue3-ui'
import App from './App.vue'
import '@pathscale/bulma-pull-2981-css-var-only'
import '@pathscale/bulma-extensions-css-var'
import '@pathscale/fonts-metroclean'
import { router } from './router'

const app = createApp(App)

app.component('VButton', VButton)
app.component('VCheckbox', VCheckbox)
app.component('VField', VField)
app.component('VInput', VInput)
app.component('VProgress', VProgress)
app.component('VSelect', VSelect)
app.component('VSidebar', VSidebar)
app.component('VTextarea', VTextarea)
app.component('VBreadcrumb', VBreadcrumb)
app.component('VBreadcrumbItem', VBreadcrumbItem)
app.component('VCard', VCard)
app.component('VCardContent', VCardContent)
app.component('VCardFooter', VCardFooter)
app.component('VCardFooterItem', VCardFooterItem)
app.component('VCardHeader', VCardHeader)
app.component('VCardImage', VCardImage)
app.component('VColumn', VColumn)
app.component('VColumns', VColumns)
app.component('VMenu', VMenu)
app.component('VMenuItem', VMenuItem)
app.component('VMenuList', VMenuList)
app.component('VNavbar', VNavbar)
app.component('VNavbarBurger', VNavbarBurger)
app.component('VNavbarDropdown', VNavbarDropdown)
app.component('VNavbarItem', VNavbarItem)
app.component('VImage', VImage)
app.component('VAccordion', VAccordion)
app.component('VIcon', VIcon)
app.component('VTag', VTag)
app.component('VTabs', VTabs)
app.component('VTab', VTab)
app.component('VSwitch', VSwitch)
app.component('VTable', VTable)
app.component('VDropdown', VDropdown)
app.component('VDropdownItem', VDropdownItem)

app.use(router).mount('#app')
