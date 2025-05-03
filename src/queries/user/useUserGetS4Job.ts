import { useQuery } from "@tanstack/vue-query";
import type { ComputedRef } from "vue";
import { ref, watchEffect } from "vue";
import { api } from "~/api";
import type {
  UserGetS4JobParams as ApiParams,
  UserGetS4JobResponse as ApiResponse,
} from "~/models/user";
import { useGlobalStore } from "~/store";

const getFn = async (params?: ApiParams) => {
  const response = await api.app.UserGetS4Job<ApiResponse, ApiParams>(params);
  return response.params;
};

export const useUserGetS4Job = (params: ComputedRef<ApiParams>) => {
  const globalStore = useGlobalStore();
  const enabled = ref(false);

  watchEffect(() => {
    enabled.value = globalStore.isConnected;
  });

  const query = useQuery({
    queryKey: ["UserGetS4Job", params],
    queryFn: () => getFn(params.value),
    retry: 1,
    enabled: enabled,
    refetchInterval: 3000,
  });
  return query;
};
