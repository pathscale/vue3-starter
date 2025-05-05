import type { RouteRecordRaw } from "vue-router";
import { DashboardRoutes } from "./dashboard.routes";
import { normalizeRoutes } from "./utils";

import authRoutes from "./auth.routes";
import publicRoutes from "./public.routes";

import { AuthLayout, DashboardLayout, PublicLayout } from "~/layouts";

import type { Component } from "vue";

const normalizedDashboardRoutes = normalizeRoutes(
  DashboardRoutes,
);

const routes: RouteRecordRaw[] = [
  {
    component: PublicLayout as unknown as Component,
    path: "/",
    children: [...publicRoutes],
  },
  {
    component: AuthLayout as unknown as Component,
    path: "/",
    children: [...authRoutes],
  },
  {
    path: "/dashboard",
    component: DashboardLayout as unknown as Component,
    children: [...normalizedDashboardRoutes],
  },
];

export { DashboardRoutes };

export default routes;
