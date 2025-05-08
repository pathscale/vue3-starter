import { useMutation } from "@tanstack/vue-query";
import { useLocalStorage } from "vue-composable";
import { $toast } from "~/main";
import { useGlobalStore } from "~/store";
import type { IAccount } from "~/store/globalStore";
import { encodePassword } from "~/utils/encoders";

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  username: string;
  displayName: string;
  avatar?: string;
  role: string;
  userId: number;
  userToken: string;
  adminToken: string;
}

const useLogin = () => {
  const globalStore = useGlobalStore();
  const login = useMutation({
    mutationFn: async (payload: LoginParams) => {
      const password = encodePassword(payload.password);
      const mockAuth: LoginResponse = {
        userId: 1, // Replace with an appropriate numeric value
        username: payload.username,
        userToken: "mockUserToken",
        adminToken: "mockAdminToken",
        displayName: "",
        role: "",
      };

      useLocalStorage("account", mockAuth);
      if (mockAuth.adminToken) {
        useLocalStorage("adminToken", mockAuth.adminToken);
      }
      useLocalStorage("userToken", mockAuth.userToken);
      useLocalStorage("username", payload.username);
      useLocalStorage("userId", mockAuth.userId);
      useLocalStorage("account", mockAuth);
      globalStore.setAccount(mockAuth as IAccount);
      await init.mutateAsync();
    },
  });

  const init = useMutation({
    mutationFn: async () => {
      const userToken = localStorage.getItem("userToken");
      const username = localStorage.getItem("username");
      if (userToken && username) {
        return { success: true };
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
      localStorage.clear();
    },
  });

  return { login, init };
};

export { useLogin };
