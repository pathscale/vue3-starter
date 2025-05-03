import { useQuery } from "@tanstack/vue-query";
import type { ComputedRef } from "vue";
import { ref, watchEffect } from "vue";
import { api } from "~/api";
import type {
  UserGetS1LedgerResponse as ApiResponse,
  UserGetLedgerResponse,
  UserGetS1LedgerParams,
  UserGetS2LedgerResponse,
} from "~/models/user";
import { useGlobalStore } from "~/store";

interface ApiParams extends UserGetS1LedgerParams {
  strategyId: number;
}

const getFn = async (params?: ApiParams) => {
  if (params?.strategyId === 1) {
    const response = await api.app.UserGetS1Ledger<ApiResponse, ApiParams>(
      params,
    );
    return { orders: response.params.data };
  }
  if (params?.strategyId === 2) {
    const response = await api.app.UserGetS2Ledger<
      UserGetS2LedgerResponse,
      ApiParams
    >(params);
    return { orders: response.params.data };
  }
  const response = await api.app.UserGetLedger<
    UserGetLedgerResponse,
    ApiParams
  >(params);
  return { orders: response.params.data };
};

export const useUserGetLedger = (params: ComputedRef<ApiParams>) => {
  const globalStore = useGlobalStore();
  const enabled = ref(false);

  watchEffect(() => {
    enabled.value = globalStore.isConnected;
  });

  const query = useQuery({
    queryKey: ["useUserGetLedger", params],
    queryFn: () => getFn(params.value),
    retry: 1,
    enabled: enabled,
    refetchInterval: 3000,
  });
  return query;
};
