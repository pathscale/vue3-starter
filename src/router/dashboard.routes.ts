import type { Component } from "vue";
import {
  AppDebug,
  Honey,
  Config,
  DashboardHome,
  Signals,
  Strategies,
  Orders,
} from "~/pages";
import type { RoutesType } from "./router.types";

export interface RoutesTypeCustom extends RoutesType {
  index: number;
}

export const DashboardRoutes: RoutesTypeCustom[] = [
  {
    isMenuItem: true,
    title: "Dashboard",
    icon: "home",
    route: {
      component: DashboardHome as unknown as Component,
      name: "dashboardHome",
      path: "/home",
    },
  },
  {
    isMenuItem: true,
    title: "Strategies",
    icon: "elementor",
    route: {
      component: Strategies as unknown as Component,
      name: "strategies",
      path: "/strategies/:strategyId",
    },
  },
  {
    route: {
      component: Signals as unknown as Component,
      name: "signals",
      path: "/strategies/:strategyId/signals",
    },
  },
  {
    route: {
      component: Orders as unknown as Component,
      name: "orders",
      path: "/strategies/:strategyId/orders",
    },
  },
  {
    isMenuItem: false,
    title: "App Debug",
    route: {
      component: AppDebug as unknown as Component,
      name: "appDebug",
      path: "/settings",
    },
  },
  {
    route: {
      component: Config as unknown as Component,
      name: "config",
      path: "/strategies/:strategyId/config",
    },
  },
].map((e, i) => ({ ...e, index: i }));
