import type { RouteRecordRaw } from "vue-router";

export interface MenuType {
  title?: string;
  icon?: string;
  isMenuItem?: boolean;
}

export interface SubRoute extends MenuType {
  route?: RouteRecordRaw;
}

export interface RoutesType extends MenuType {
  route?: RouteRecordRaw;
  subRoutes?: SubRoute[];
}
