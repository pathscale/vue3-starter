import { useQuery } from "@tanstack/vue-query";
import { ref, watchEffect } from "vue";
import { api } from "~/api";
import { queryClient } from "~/main";
import type {
  UserSubOrdersParams as ApiParams,
  UserSubOrdersResponse as StreamResponse,
} from "~/models/user";

import { useGlobalStore } from "~/store";

interface ApiResponse {
  data: StreamResponse;
  lastUpdatedAt: number;
}

const getFn = async (params?: ApiParams) => {
  const response = await api.app.UserSubOrders<ApiResponse, ApiParams>(params);
  return response.params;
};

export const unsubscribeUserSubOrders = () => getFn({ unsubscribe: true });

export const updateUserSubOrders = (payload: StreamResponse) => {
  if (payload && Object.keys(payload)) {
    const lastUpdatedAt = Date.now();
    queryClient.setQueryData(["UserSubOrders"], {
      data: payload,
      lastUpdatedAt,
    });
  }
};

export const useUserSubOrders = (params: ApiParams) => {
  const globalStore = useGlobalStore();
  const enabled = ref(false);

  watchEffect(() => {
    enabled.value = globalStore.isConnected;
  });

  const query = useQuery({
    queryKey: ["UserSubOrders"],
    queryFn: () => getFn(params),
    enabled,
    retry: 1,
  });
  return query;
};
