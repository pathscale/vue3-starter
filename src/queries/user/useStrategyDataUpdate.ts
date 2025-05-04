import { useQuery } from "@tanstack/vue-query";
import { ref, watch } from "vue";
import { queryClient } from "~/main";
import type { StrategyDataUpdate as StreamResponse } from "~/models/user/StrategyDataUpdate";

import { useGlobalStore } from "~/store";

const getFn = async (): StreamResponse => {
  return {};
};

export const updateStrategyDataUpdate = (payload: StreamResponse) => {
  if (payload && Object.keys(payload).length) {
    const currentData = queryClient.getQueryData([
      "StrategyDataUpdate",
    ]) as StreamResponse;
    const lastUpdatedAt = Date.now();

    const updatedData: StreamResponse = {
      update_orders: payload.update_orders,
      balances: payload.balances,
      positions: payload.positions,
      lastUpdatedAt: lastUpdatedAt,
    };
    queryClient.setQueryData(
      ["StrategyDataUpdate"],
      currentData ? { ...currentData, ...updatedData } : updatedData,
    );
  }
};