import type { IService } from "@pathscale/wss-adapter/types";
import config from "~/config";

import adminMethods from "./admin.json";
import methods from "./user.json";

const appServer = localStorage.getItem("appServer") || config.appServer;

const service: IService = {
  remote: appServer,
  methods: Object.assign(methods, adminMethods),
};

export { appServer };

export default service;
