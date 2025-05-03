import type { RouteRecordRaw } from "vue-router";
import { useRouter } from "vue-router";
import type { RoutesTypeCustom } from "~/router/admin.routes";
import type { RoutesType } from "./router.types";

export const normalizeRoutes = (
  routeList: RoutesType[],
  redirectList?: RouteRecordRaw[],
): RouteRecordRaw[] => {
  const routes: RouteRecordRaw[] = [];
  routeList
    .filter((menu) => menu.route || menu.subRoutes)
    .forEach((menu) => {
      if (menu.subRoutes) {
        menu.subRoutes.forEach((e) => {
          if (e.route) {
            routes.push({
              ...e.route,
              meta: {
                ...e.route.meta,
              },
            });
          }
        });
      }
      if (menu.route) {
        routes.push({
          ...menu.route,
          meta: {
            ...menu.route.meta,
          },
        });
      }
    });

  return redirectList ? [...routes, ...redirectList] : routes;
};

export const withMeta = (
  routes: RouteRecordRaw[],
  meta: Record<string, unknown>,
): RouteRecordRaw[] => {
  routes.forEach((route) => {
    // @ts-ignore
    Object.assign(route.meta, meta);
  });

  return routes;
};

export const useRouterUtils = () => {
  const router = useRouter();
  return {
    isActiveTab: (routeItem: RoutesTypeCustom) => {
      const name = routeItem.route?.name;
      const path = routeItem.route?.path;
      if (!name) {
        console.warn(
          `No name for route ${path} found. Name should exist to prevent tab matching problem.`,
        );
      }
      return name
        ? router.currentRoute.value.name === name
        : router.currentRoute.value.path === path;
    },
  };
};
