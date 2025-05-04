import { router } from "~/router";
import errors from "../../docs/error_codes/error_codes.json";
import app from "./services/app.service";
import auth from "./services/auth.service";
import wssAdapter from "./wss-adapter/wssAdapter";

import { $toast } from "~/main";
import {
  updateUserSubOrders,
  updateUserSubPosition,
} from "~/queries/user";

export const cleanupLocalStorageOnLogout = () => {
  localStorage.removeItem("username");
  localStorage.removeItem("userToken");
  localStorage.removeItem("account");
  localStorage.removeItem("userId");
  localStorage.removeItem("adminToken");
  router.replace({ name: "login" });
};

const wssConfigure = () => {
  wssAdapter.configure({
    timeout: 1000 * 30,
    services: {
      auth: {
        ...auth,
        onDisconnect() {
          console.log("disconnected from auth!");
        },
      },
      app: {
        ...app,
        onDisconnect() {
          console.log("disconnected from app!");
          $toast.error("You have been disconnected from the server");
          setTimeout(() => {
            cleanupLocalStorageOnLogout();
          }, 2000);
        },
        subscriptions: {
          UserSubPosition: updateUserSubPosition,
          UserSubOrders: updateUserSubOrders,
        },
      },
    },
    errors,
  });
  console.log("wss client configured");
};

export default wssConfigure;
