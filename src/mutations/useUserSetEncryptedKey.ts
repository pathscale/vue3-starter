import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { api } from "~/api";
import type {
  UserSetEncryptedKeyParams as ApiParams,
  UserSetEncryptedKeyResponse as ApiResponse,
} from "~/models/user";

const mutationFn = async (payload: ApiParams) => {
  const response = await api.app.UserSetEncryptedKey<ApiResponse, ApiParams>(
    payload,
  );
  return response.params;
};

export const useUserSetEncryptedKey = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["UserGetEncryptedKey"] });
    },
  });
  return mutation;
};
