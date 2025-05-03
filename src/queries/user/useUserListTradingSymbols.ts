import { useQuery } from "@tanstack/vue-query";
import { ref, watchEffect } from "vue";
import { api } from "~/api";
import type {
  UserListTradingSymbolsParams as ApiParams,
  UserListTradingSymbolsResponse as ApiResponse,
} from "~/models/user";
import { useGlobalStore } from "~/store";

const getFn = async () => {
  const response = await api.app.UserListTradingSymbols<
    ApiResponse,
    ApiParams
  >();
  return response.params.data;
};

export const useUserListTradingSymbols = () => {
  const globalStore = useGlobalStore();
  const enabled = ref(false);
  watchEffect(() => {
    enabled.value = globalStore.isConnected;
  });

  const query = useQuery({
    queryKey: ["UserListTradingSymbols"],
    queryFn: () => getFn(),
    retry: 1,
    enabled: enabled,
  });
  return query;
};
