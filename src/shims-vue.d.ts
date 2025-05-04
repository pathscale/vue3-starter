import type { CustomHeader } from "./components";
declare module "vue" {
  export interface GlobalComponents {
    CustomHeader: typeof CustomHeader;
  }
}
declare module "*.vue" {
  import Vue from "vue";

  export default Vue;
}
