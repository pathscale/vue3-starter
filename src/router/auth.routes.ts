import type { Component } from "vue";
import type { RouteRecordRaw } from "vue-router";
import { ForgotPassword, Login, Signup, SwitchServer } from "~/pages";

const routes: RouteRecordRaw[] = [
  {
    component: Login as unknown as Component,
    name: "login",
    path: "login",
  },
  {
    component: Signup as unknown as Component,
    name: "signup",
    path: "signup",
  },
  {
    component: SwitchServer as unknown as Component,
    name: "switchServer",
    path: "switchServer",
  },
  {
    component: ForgotPassword as unknown as Component,
    name: "forgotPassword",
    path: "forgot-password",
  },
];

export default routes;
