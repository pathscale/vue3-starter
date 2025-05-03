import { useMutation } from "@tanstack/vue-query";
import { useLocalStorage } from "vue-composable";
import { service } from "~/api";
import { cleanupLocalStorageOnLogout } from "~/api/wssConfigure";
import { $toast } from "~/main";
import type {
  AuthorizeResponse,
  LoginParams,
  LoginResponse,
} from "~/models/auth";
import { useGlobalStore } from "~/store";
import type { IAccount } from "~/store/globalStore";
import { encodePassword } from "~/utils/encoders";

const useLogin = () => {
  const globalStore = useGlobalStore();
  const login = useMutation({
    mutationFn: async (payload: LoginParams) => {
      const password = encodePassword(payload.password);
      const params = [
        "0login",
        `1${payload.username}`,
        `2${password}`,
        `3${payload.service}`,
        `4${payload.deviceId}`,
        `5${payload.deviceOs}`,
      ];
      const auth = await service.app.connect<LoginResponse>(params);

      useLocalStorage("account", auth);
      if (auth.adminToken) {
        useLocalStorage("adminToken", auth.adminToken);
      }
      useLocalStorage("userToken", auth.userToken);
      useLocalStorage("username", payload.username);
      useLocalStorage("userId", auth.userId);
      useLocalStorage("account", auth);
      globalStore.setAccount(auth as IAccount);
      await init.mutateAsync();
    },
  });

  const init = useMutation({
    mutationFn: async () => {
      const userToken = localStorage.getItem("userToken");
      const username = localStorage.getItem("username");
      const deviceId = "24787297130491616";
      const deviceOs = "android";
      if (userToken) {
        const params = [
          "0authorize",
          `1${username}`,
          `2${userToken}`,
          "3" + "User",
          `4${deviceId}`,
          `5${deviceOs}`,
        ];

        return await service.app.connect<AuthorizeResponse>(params);
      }
    },
    onSuccess: () => {
      const userToken = localStorage.getItem("userToken");
      const username = localStorage.getItem("username");
      if (userToken && username) {
        globalStore.setIsConnected(true);
        $toast.success("Connected!");
      }
    },
    onError: () => {
      cleanupLocalStorageOnLogout();
    },
  });

  return { login, init };
};

export { useLogin };
