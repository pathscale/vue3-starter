import { useQuery } from "@tanstack/vue-query";
import type { ComputedRef } from "vue";
import { ref, watchEffect } from "vue";
import { api } from "~/api";
import type {
  UserGetS2SignalParams,
  UserGetS2SignalResponse,
  UserGetS3SignalResponse,
  UserGetS4SignalResponse,
  UserGetSignal1Response,
} from "~/models/user";
import { useGlobalStore } from "~/store";

interface ApiParams extends UserGetS2SignalParams {
  strategyId: number;
}

const getFn = async (params?: ApiParams) => {
  if (params?.strategyId === 1) {
    const response = await api.app.UserGetSignal1<
      UserGetSignal1Response,
      ApiParams
    >(params);
    return response.params.data;
  }
  if (params?.strategyId === 2) {
    const response = await api.app.UserGetS2Signal<
      UserGetS2SignalResponse,
      ApiParams
    >(params);
    return response.params.data;
  }
  if (params?.strategyId === 3) {
    const response = await api.app.UserGetS3Signal<
      UserGetS3SignalResponse,
      ApiParams
    >(params);
    return response.params.data;
  }
  if (params?.strategyId === 4) {
    const response = await api.app.UserGetS4Signal<
      UserGetS4SignalResponse,
      ApiParams
    >(params);
    return response.params.data;
  }

  return [];
};

export const useUserGetSignal = (params: ComputedRef<ApiParams>) => {
  const globalStore = useGlobalStore();
  const enabled = ref(false);

  watchEffect(() => {
    enabled.value = globalStore.isConnected;
  });

  const query = useQuery({
    queryKey: ["UserGetSignal", params],
    queryFn: () => getFn(params.value),
    retry: 1,
    enabled: enabled,
    refetchInterval: 3000,
  });
  return query;
};
