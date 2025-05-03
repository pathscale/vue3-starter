import { useQuery } from "@tanstack/vue-query";
import { ref, watchEffect } from "vue";
import { api } from "~/api";
import type { UserGetEncryptedKeyResponse as ApiResponse } from "~/models/user";
import { useGlobalStore } from "~/store";

const getFn = async () => {
  const response = await api.app.UserGetEncryptedKey<ApiResponse>();
  return response.params;
};

export const useUserGetEncryptedKey = () => {
  const globalStore = useGlobalStore();
  const enabled = ref(false);

  watchEffect(() => {
    enabled.value = globalStore.isConnected;
  });

  const query = useQuery({
    queryKey: ["UserGetEncryptedKey"],
    queryFn: () => getFn(),
    retry: 1,
    enabled: enabled,
  });
  return query;
};
