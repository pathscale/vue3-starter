import { useQuery } from "@tanstack/vue-query";
import type { ComputedRef } from "vue";
import { ref, watchEffect } from "vue";
import { api } from "~/api";
import type {
  UserGetS2PositionResponse as ApiResponse,
  UserGetPositionResponse,
  UserGetS2PositionParams,
} from "~/models/user";
import { useGlobalStore } from "~/store";

interface ApiParams extends UserGetS2PositionParams {
  strategyId: number;
}

const getFn = async (params?: ApiParams) => {
  if (params?.strategyId === 2) {
    const response = await api.app.UserGetS2Position<ApiResponse, ApiParams>(
      params,
    );
    return { data: response.params.data };
  }
  const response = await api.app.UserGetPosition<
    UserGetPositionResponse,
    ApiParams
  >(params);
  return { data: response.params.data };
};

export const useUserGetPositions = (params: ComputedRef<ApiParams>) => {
  const globalStore = useGlobalStore();
  const enabled = ref(false);

  watchEffect(() => {
    enabled.value = globalStore.isConnected;
  });

  const query = useQuery({
    queryKey: ["UserGetPositions", params],
    queryFn: () => getFn(params.value),
    retry: 1,
    enabled: enabled,
    refetchInterval: 3000,
  });
  return query;
};
