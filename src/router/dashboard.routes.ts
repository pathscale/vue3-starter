import type { Component } from "vue";
import type { RouteRecordRaw } from "vue-router";
import {
  AppDebug,
  Blacklist,
  Honey,
  ComplexSignals,
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
    } as RouteRecordRaw,
  },
  {
    isMenuItem: false,
    title: "Honey",
    icon: "orders",
    route: {
      component: Honey as unknown as Component,
      name: "honey",
      path: "/honey",
    } as RouteRecordRaw,
  },

  {
    isMenuItem: true,
    title: "Strategies",
    icon: "elementor",
    route: {
      component: Strategies as unknown as Component,
      name: "strategies",
      path: "/strategies/:strategyId",
    } as RouteRecordRaw,
  },
  {
    route: {
      component: Signals as unknown as Component,
      name: "signals",
      path: "/strategies/:strategyId/signals",
    } as RouteRecordRaw,
  },
  {
    route: {
      component: ComplexSignals as unknown as Component,
      name: "complexSignals",
      path: "/strategies/:strategyId/complexSignals",
    } as RouteRecordRaw,
  },
  {
    route: {
      component: Orders as unknown as Component,
      name: "orders",
      path: "/strategies/:strategyId/orders",
    } as RouteRecordRaw,
  },
  {
    route: {
      component: Blacklist as unknown as Component,
      name: "blacklist",
      path: "/strategies/:strategyId/blacklist",
    } as RouteRecordRaw,
  },
  {
    isMenuItem: false,
    title: "App Debug",
    route: {
      component: AppDebug as unknown as Component,
      name: "appDebug",
      path: "/settings/appDebug",
    } as RouteRecordRaw,
  },
  {
    route: {
      component: Config as unknown as Component,
      name: "config",
      path: "/strategies/:strategyId/config",
    } as RouteRecordRaw,
  },
].map((e, i) => ({ ...e, index: i }));
