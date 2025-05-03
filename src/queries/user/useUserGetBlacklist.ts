import { useQuery } from "@tanstack/vue-query";
import { ref, watchEffect } from "vue";
import { api } from "~/api";
import type {
  UserGetBlacklistParams as ApiParams,
  UserGetBlacklistResponse as ApiResponse,
} from "~/models/user";
import { useGlobalStore } from "~/store";

const getFn = async (params: ApiParams) => {
  const response = await api.app.UserGetBlacklist<ApiResponse, ApiParams>(
    params,
  );
  return response.params;
};

export const useUserGetBlacklist = (params: ApiParams) => {
  const globalStore = useGlobalStore();
  const enabled = ref(false);
  watchEffect(() => {
    enabled.value = globalStore.isConnected;
  });

  const query = useQuery({
    queryKey: [`UserGetBlacklist${params}`],
    queryFn: () => getFn(params),
    retry: 1,
    enabled,
  });
  return query;
};
