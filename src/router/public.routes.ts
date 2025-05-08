import type { Component } from "vue";
import type { RouteRecordRaw } from "vue-router";
import { Home } from "~/pages";

const routes: RouteRecordRaw[] = [
  {
    component: Home as unknown as Component,
    name: "home",
    path: "/",
  },
];

export default routes;
