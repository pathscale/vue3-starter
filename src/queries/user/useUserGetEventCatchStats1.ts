import { useQuery } from "@tanstack/vue-query";
import { ref, watchEffect } from "vue";
import { api } from "~/api";
import type {
  UserGetEventCatchStats1Params,
  UserGetEventCatchStats1Response,
} from "~/models/user";
import { useGlobalStore } from "~/store";

const getFn = async () => {
  const response = await api.app.UserGetEventCatchStats1<
    UserGetEventCatchStats1Response,
    UserGetEventCatchStats1Params
  >();
  return response.params;
};

export const useUserGetEventCatchStats1 = () => {
  const globalStore = useGlobalStore();
  const enabled = ref(false);

  watchEffect(() => {
    enabled.value = globalStore.isConnected;
  });

  const query = useQuery({
    queryKey: ["UserGetEventCatchStats1"],
    queryFn: getFn,
    retry: 1,
    enabled,
    refetchInterval: 3000,
  });
  return query;
};
