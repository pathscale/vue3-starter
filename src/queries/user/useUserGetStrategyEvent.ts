import { useQuery } from "@tanstack/vue-query";
import type { ComputedRef } from "vue";
import { ref, watchEffect } from "vue";
import { api } from "~/api";
import type {
  UserGetDebugEvent1Response,
  UserGetEvent1Params,
  UserGetEvent1Response,
  UserGetS2DebugEventResponse,
  UserGetS2EventResponse,
  UserGetS3DebugEventResponse,
  UserGetS3EventResponse,
  UserGetS4DebugEventResponse,
  UserGetS4EventResponse,
} from "~/models/user";
import { useGlobalStore } from "~/store";

interface ApiParams extends UserGetEvent1Params {
  strategyId: number;
  debug?: boolean;
}

const sortData = (
  data: any[],
):
  | UserGetEvent1Response["data"]
  | UserGetS2EventResponse["data"]
  | UserGetS3EventResponse["data"] => {
  return data.sort((a, b) => {
    if (a.id < b.id) {
      return 1;
    }
    if (a.id > b.id) {
      return -1;
    }
    return 0;
  });
};

const getFn = async (params?: ApiParams) => {
  if (params?.strategyId === 1) {
    if (params.debug) {
      const response = await api.app.UserGetDebugEvent1<
        UserGetDebugEvent1Response,
        ApiParams
      >(params);

      const sortedData = sortData(response.params.data.slice(-4000));
      return { events: sortedData };
    }
    const response = await api.app.UserGetEvent1<
      UserGetEvent1Response,
      ApiParams
    >(params);
    const sortedData = sortData(response.params.data);
    return { events: sortedData };
  }

  if (params?.strategyId === 2) {
    if (params.debug) {
      const response = await api.app.UserGetS2DebugEvent<
        UserGetS2DebugEventResponse,
        ApiParams
      >(params);
      const sortedData = sortData(response.params.data.slice(-4000));
      return { events: sortedData };
    }
    const response = await api.app.UserGetS2Event<
      UserGetS2EventResponse,
      ApiParams
    >(params);
    const sortedData = sortData(response.params.data);
    return { events: sortedData };
  }

  if (params?.strategyId === 3) {
    if (params.debug) {
      const response = await api.app.UserGetS3DebugEvent<
        UserGetS3DebugEventResponse,
        ApiParams
      >(params);
      const sortedData = sortData(response.params.data.slice(-4000));
      return { events: sortedData };
    }
    const response = await api.app.UserGetS3Event<
      UserGetS3EventResponse,
      ApiParams
    >(params);
    const sortedData = sortData(response.params.data);
    return { events: sortedData };
  }

  if (params?.strategyId === 4) {
    if (params.debug) {
      const response = await api.app.UserGetS4DebugEvent<
        UserGetS4DebugEventResponse,
        ApiParams
      >(params);
      const sortedData = sortData(response.params.data.slice(-4000));
      return { events: sortedData };
    }
    const response = await api.app.UserGetS4Event<
      UserGetS4EventResponse,
      ApiParams
    >(params);
    const sortedData = sortData(response.params.data);
    return { events: sortedData };
  }

  return { events: [] };
};

export const useUserGetStrategyEvent = (params: ComputedRef<ApiParams>) => {
  const globalStore = useGlobalStore();
  const enabled = ref(false);

  watchEffect(() => {
    enabled.value = globalStore.isConnected;
  });

  const query = useQuery({
    queryKey: ["UserGetStrategyEvent", params],
    queryFn: () => getFn(params.value),
    retry: 1,
    enabled: enabled,
    refetchInterval: 1000,
  });
  return query;
};
