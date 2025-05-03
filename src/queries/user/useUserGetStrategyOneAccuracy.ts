import { useQuery } from "@tanstack/vue-query";
import type { ComputedRef } from "vue";
import { ref, watchEffect } from "vue";
import { api } from "~/api";
import type { UserGetStrategyOneAccuracyResponse as ApiResponse } from "~/models/user";
import { useGlobalStore } from "~/store";

const getFn = async () => {
  const response = await api.app.UserGetStrategyOneAccuracy<ApiResponse>();
  return response.params;
};

export const useUserGetStrategyOneAccuracy = (
  options: ComputedRef<{ enabled: boolean }>,
) => {
  const globalStore = useGlobalStore();
  const enabled = ref(false);

  watchEffect(() => {
    enabled.value = globalStore.isConnected && options.value.enabled;
  });

  const query = useQuery({
    queryKey: ["UserGetStrategyOneAccuracy"],
    queryFn: () => getFn(),
    retry: 1,
    enabled: enabled,
  });
  return query;
};
