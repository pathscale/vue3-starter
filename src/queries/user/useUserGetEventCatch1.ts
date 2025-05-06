import { useQuery } from "@tanstack/vue-query";
import { ref, watchEffect } from "vue";
import { api } from "~/api";
import type {
  UserGetEventCatch1Params,
  UserGetEventCatch1Response,
} from "~/models/user";
import { useGlobalStore } from "~/store";

const getFn = async () => {
  // Mock data for testing
  return {
    data: [
      {
        id: 1,
        timestamp: new Date().getTime(),
        symbol: "BTC-PERP",
        initialBinanceHyperSpreadBp: 25.5,
        initialAvgBinHyperSpreadBp: 22.3,
        initialHyperPrice: 45000.5,
        initialBinancePrice: 45100.75,
        initialBinanceChangeBp: 15.2,
        catchTransactionTimestamp: new Date().getTime() - 5000,
        catchTimeHumanReadable: "5s",
        catchVariant: "Type A",
        orderbookHyperliquidBidAtCatchTime: 44990.25,
        orderbookHyperliquidAskAtCatchTime: 45010.75,
        orderbookBinanceCatchPrice: 45005.5,
        catchBinanceHyperSpreadBp: 18.5,
        catchAvgBinHyperSpreadBp: 17.2,
        differenceHlBp: -2.5,
        differenceBinanceBp: 3.2,
      },
      {
        id: 2,
        timestamp: new Date().getTime() - 60000,
        symbol: "ETH-PERP",
        initialBinanceHyperSpreadBp: 30.2,
        initialAvgBinHyperSpreadBp: 28.1,
        initialHyperPrice: 2300.25,
        initialBinancePrice: 2305.5,
        initialBinanceChangeBp: 12.5,
        catchTransactionTimestamp: new Date().getTime() - 65000,
        catchTimeHumanReadable: "1m 5s",
        catchVariant: "Type B",
        orderbookHyperliquidBidAtCatchTime: 2299.75,
        orderbookHyperliquidAskAtCatchTime: 2301.25,
        orderbookBinanceCatchPrice: 2300.5,
        catchBinanceHyperSpreadBp: 15.8,
        catchAvgBinHyperSpreadBp: 14.9,
        differenceHlBp: -1.8,
        differenceBinanceBp: 2.4,
      },
    ],
  };
};

export const useUserGetEventCatch1 = () => {
  const globalStore = useGlobalStore();
  const enabled = ref(false);

  watchEffect(() => {
    enabled.value = globalStore.isConnected;
  });

  const query = useQuery({
    queryKey: ["UserGetEventCatch1"],
    queryFn: getFn,
    retry: 1,
    enabled,
    refetchInterval: 3000,
  });
  return query;
};
