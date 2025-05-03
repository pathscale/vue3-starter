import type { IService } from "@pathscale/wss-adapter/types";

import config from "~/config";

import methods from "./auth.json";

const service: IService = {
  remote: config.authServer,
  methods,
};

export default service;
