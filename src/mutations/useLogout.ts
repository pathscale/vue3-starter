import { useMutation } from "@tanstack/vue-query";
import { api } from "~/api";
import type { LogoutParams, LogoutResponse } from "~/models/auth";

const useLogout = () => {
  const mutation = useMutation({
    mutationFn: async () => {
      await api.auth.Logout<LogoutResponse, LogoutParams>(); // TODO: this does not work because the connection to the auth serve gets dropped after login/signup
    },
  });
  return mutation;
};

export { useLogout };
