import { useMutation } from "@tanstack/vue-query";
import { v4 } from "uuid";
import { service } from "~/api";
import type { AuthorizeResponse } from "~/models/auth";
import { useGlobalStore } from "~/store";

export const useLoginAsGuest = () => {
  const globalStore = useGlobalStore();
  return useMutation({
    mutationFn: async () => {
      const userToken = v4();
      const username = "guest";
      const deviceId = "24787297130491616";
      const deviceOs = "android";
      // if (userToken) {
      const params = [
        "0authorize",
        `1${username}`,
        `2${userToken}`,
        "3" + "User",
        `4${deviceId}`,
        `5${deviceOs}`,
      ];
      return await service.app.connect<AuthorizeResponse>(params);
      // }
    },
    onSuccess: () => {
      globalStore.setIsConnected(true);
    },
  });
};
