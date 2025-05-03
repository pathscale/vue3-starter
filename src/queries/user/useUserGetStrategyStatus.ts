import { useQuery } from "@tanstack/vue-query";
import { ref, watchEffect } from "vue";
import { api } from "~/api";
import type {
  UserSetStrategyStatusParams as ApiParams,
  UserSetStrategyStatusResponse as ApiResponse,
} from "~/models/user";
import { useGlobalStore } from "~/store";

const getFn = async () => {
  const response = await api.app.UserSetStrategyStatus<
    ApiResponse,
    ApiParams
  >();
  return response.params.data;
};

export const useUserGetStrategyStatus = () => {
  const globalStore = useGlobalStore();
  const enabled = ref(false);
  watchEffect(() => {
    enabled.value = globalStore.isConnected;
  });

  const query = useQuery({
    queryKey: ["UserGetStrategyStatus"],
    queryFn: () => getFn(),
    retry: 1,
    enabled: enabled,
  });
  return query;
};
