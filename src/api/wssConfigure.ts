import { router } from "~/router";
import errors from "../../docs/error_codes/error_codes.json";
import app from "./services/app.service";
import auth from "./services/auth.service";
import wssAdapter from "./wss-adapter/wssAdapter";

import { $toast } from "~/main";
import {
  updateSubS3TerminalBestAskBestBid,
  updateUserSubOrders,
  updateUserSubPosition,
  updateUserSubStrategy3PositionsClosing,
  updateUserSubStrategy3PositionsOpening,
  updateUserSubStrategyData,
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
          UserSubPriceDifference: updateUserSubStrategyData,
          UserSubPrice0: updateUserSubStrategyData,
          UserSubBestBidAskAcrossExchanges: updateUserSubStrategyData,
          UserSubPosition: updateUserSubPosition,
          UserSubOrders: updateUserSubOrders,
          SubS3TerminalBestAskBestBid: updateSubS3TerminalBestAskBestBid,
          UserSubStrategy3PositionsOpening:
            updateUserSubStrategy3PositionsOpening,
          UserSubStrategy3PositionsClosing:
            updateUserSubStrategy3PositionsClosing,
        },
      },
    },
    errors,
  });
  console.log("wss client configured");
};

export default wssConfigure;
