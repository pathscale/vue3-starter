import { useQuery } from "@tanstack/vue-query";
import { ref, watchEffect } from "vue";
import { api } from "~/api";
import type {
  AdminListAlertTypesParams as ApiParams,
  AdminListAlertTypesResponse as ApiResponse,
} from "~/models/admin";
import { useGlobalStore } from "~/store";

const getFn = async (params?: ApiParams) => {
  const response = await api.app.AdminListAlertTypes<ApiResponse, ApiParams>(
    params,
  );
  return response.params;
};

export const useAdminListAlertTypes = (params?: ApiParams) => {
  const globalStore = useGlobalStore();
  const enabled = ref(false);
  watchEffect(() => {
    enabled.value = globalStore.isConnected;
  });

  const query = useQuery({
    queryKey: ["AdminListAlertTypes"],
    queryFn: () => getFn(params),
    retry: 1,
    enabled,
  });
  return query;
};
