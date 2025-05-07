import { createApp } from "vue";
import { createPinia } from "pinia";
import "./Icons.vue";
import {
  Loader,
  Modal,
  CustomTable,
  CustomFooter,
  CustomHeader,
} from "./components";

import i18n from "./i18n";

import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";

const queryClient = new QueryClient();

import {
  Toaster,
  VAccordion,
  VAvatar,
  VBreadcrumb,
  VBreadcrumbItem,
  VButton,
  VCard,
  VCardContent,
  VCardFooter,
  VCardFooterItem,
  VCardHeader,
  VCardImage,
  VCheckbox,
  VColumn,
  VColumns,
  VDropdown,
  VDropdownItem,
  VField,
  VImage,
  VInput,
  VMenu,
  VMenuItem,
  VMenuList,
  VNavbar,
  VNavbarBurger,
  VNavbarDropdown,
  VNavbarItem,
  VProgress,
  VSteps,
  VStepItem,
  VSelect,
  VSidebar,
  VSwitch,
  VTab,
  VTable,
  VTabs,
  VTag,
  VTextarea,
  VTimeline,
  VUpload,
  VPagination,
  VSlider,
  VTooltip,
} from "@pathscale/vue3-ui";
import App from "./App.vue";

import "@bulvar/bulma/css/bulma.css";
import "@pathscale/bulma-extensions-css-var";

import "@pathscale/fonts-metroclean";
import { router } from "./router";
import Icon from "./Icon.vue";

import "./assets/css/globals.css";
import "./assets/css/theme-colors.css";

const pinia = createPinia();
const app = createApp(App);

app.component("VAccordion", VAccordion);
app.component("VAvatar", VAvatar);
app.component("VBreadcrumb", VBreadcrumb);
app.component("VBreadcrumbItem", VBreadcrumbItem);
app.component("VButton", VButton);
app.component("VCard", VCard);
app.component("VCardContent", VCardContent);
app.component("VCardFooter", VCardFooter);
app.component("VCardFooterItem", VCardFooterItem);
app.component("VCardHeader", VCardHeader);
app.component("VCardImage", VCardImage);
app.component("VCheckbox", VCheckbox);
app.component("VColumn", VColumn);
app.component("VColumns", VColumns);
app.component("VDropdown", VDropdown);
app.component("VDropdownItem", VDropdownItem);
app.component("VField", VField);
app.component("VImage", VImage);
app.component("VInput", VInput);
app.component("VMenu", VMenu);
app.component("VMenuItem", VMenuItem);
app.component("VMenuList", VMenuList);
app.component("VNavbar", VNavbar);
app.component("VNavbarBurger", VNavbarBurger);
app.component("VNavbarDropdown", VNavbarDropdown);
app.component("VNavbarItem", VNavbarItem);
app.component("VProgress", VProgress as any);
app.component("VSelect", VSelect);
app.component("VSidebar", VSidebar);
app.component("VSwitch", VSwitch);
app.component("VTab", VTab);
app.component("VTable", VTable);
app.component("VTabs", VTabs);
app.component("VTag", VTag);
app.component("VTextarea", VTextarea);
app.component("VTimeline", VTimeline);
app.component("VUpload", VUpload);
app.component("VPagination", VPagination);
app.component("VSteps", VSteps);
app.component("VStepItem", VStepItem);
app.component("VSlider", VSlider);
app.component("VTooltip", VTooltip);
app.component("Icon", Icon);

app.component("Modal", Modal);
app.component("Loader", Loader);
app.component("CTable", CustomTable);

app.component("CustomHeader", CustomHeader);
app.component("CustomFooter", CustomFooter);

app.use(Toaster as any);

app.use(router);
app.use(pinia);
app.use(VueQueryPlugin, {
  queryClient,
});
app.use(i18n).mount("#app");

const { $toast } = app.config.globalProperties;

app.directive("visible", (el, binding) => {
  el.style.visibility = binding.value ? "visible" : "hidden";
});

export { queryClient, $toast };
