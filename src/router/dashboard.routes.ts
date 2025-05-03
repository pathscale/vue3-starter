import type { Component } from "vue";
import type { RouteRecordRaw } from "vue-router";
import {
  AppDebug,
  Blacklist,
  Cefi,
  ComplexSignals,
  Config,
  DashboardHome,
  EncryptedKeys,
  Events,
  EventsDebug,
  FundingComparison,
  HedgedOrders,
  HistoricalData,
  Jobs,
  Ledger,
  LivePosition,
  LivePositions,
  Orders,
  Performance,
  Positions,
  Signals,
  Slippage,
  SpreadMean,
  Strategies,
  StrategyLedger,
  StreamData,
  Tests,
  Trade,
  TradingTerminal,
} from "~/pages";
import type { RoutesType } from "./router.types";

export interface RoutesTypeCustom extends RoutesType {
  index: number;
}

interface RedirectType {
  path: string;
  redirect: string;
}

export const DashboardRedirects: RedirectType[] = [
  { path: "/settings", redirect: "/settings/encryptedKeys" },
];

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
    title: "Cefi",
    icon: "orders",
    route: {
      component: Cefi as unknown as Component,
      name: "cefi",
      path: "/cefi",
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
      component: HistoricalData as unknown as Component,
      name: "historicalData",
      path: "/strategies/:strategyId/historical",
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
      component: Events as unknown as Component,
      name: "events",
      path: "/strategies/:strategyId/events",
    } as RouteRecordRaw,
  },
  {
    route: {
      component: EventsDebug as unknown as Component,
      name: "eventDebug",
      path: "/strategies/:strategyId/eventDebug",
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
      component: StrategyLedger as unknown as Component,
      name: "strategyLedger",
      path: "/strategies/:strategyId/ledger",
    } as RouteRecordRaw,
  },
  {
    route: {
      component: HedgedOrders as unknown as Component,
      name: "hedgedOrders",
      path: "/strategies/:strategyId/hedgedOrders",
    } as RouteRecordRaw,
  },
  {
    route: {
      component: Slippage as unknown as Component,
      name: "slippage",
      path: "/strategies/:strategyId/slippage",
    } as RouteRecordRaw,
  },
  {
    route: {
      component: LivePosition as unknown as Component,
      name: "livePosition",
      path: "/strategies/:strategyId/livePosition",
    } as RouteRecordRaw,
  },
  {
    route: {
      component: Positions as unknown as Component,
      name: "positions",
      path: "/strategies/:strategyId/positions",
    } as RouteRecordRaw,
  },
  {
    route: {
      component: SpreadMean as unknown as Component,
      name: "spreadMean",
      path: "/strategies/:strategyId/spreadMean",
    } as RouteRecordRaw,
  },
  {
    route: {
      component: Tests as unknown as Component,
      name: "tests",
      path: "/strategies/:strategyId/tests",
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
    route: {
      component: StreamData as unknown as Component,
      name: "streamData",
      path: "/strategies/:strategyId/stream",
    } as RouteRecordRaw,
  },
  {
    route: {
      component: TradingTerminal as unknown as Component,
      name: "tradingTerminal",
      path: "/strategies/:strategyId/tradingTerminal",
    } as RouteRecordRaw,
  },
  {
    isMenuItem: false,
    title: "Ledger",
    icon: "signal",
    route: {
      component: Ledger as unknown as Component,
      name: "ledger",
      path: "/ledger",
    } as RouteRecordRaw,
  },
  {
    isMenuItem: true,
    title: "Live Positions",
    icon: "cash",
    route: {
      component: LivePositions as unknown as Component,
      name: "livePositions",
      path: "/livePositions",
    } as RouteRecordRaw,
  },

  {
    isMenuItem: true,
    title: "Trading Terminal",
    icon: "download",
    route: {
      component: Trade as unknown as Component,
      name: "trade",
      path: "/trade",
    } as RouteRecordRaw,
  },
  {
    isMenuItem: false,
    title: "Encrypted Keys",
    route: {
      component: EncryptedKeys as unknown as Component,
      name: "encryptedKeys",
      path: "/settings/encryptedKeys",
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
    isMenuItem: true,
    title: "Performance",
    icon: "cash",
    route: {
      component: Performance as unknown as Component,
      name: "performance",
      path: "/performance",
    } as RouteRecordRaw,
  },
  {
    isMenuItem: true,
    title: "Funding Comparison",
    route: {
      component: FundingComparison as unknown as Component,
      name: "fundingComparison",
      path: "/fundingComparison",
    } as RouteRecordRaw,
  },
  {
    route: {
      component: Config as unknown as Component,
      name: "config",
      path: "/strategies/:strategyId/config",
    } as RouteRecordRaw,
  },
  {
    route: {
      component: Jobs as unknown as Component,
      name: "jobs",
      path: "/strategies/:strategyId/jobs",
    } as RouteRecordRaw,
  },
].map((e, i) => ({ ...e, index: i }));
