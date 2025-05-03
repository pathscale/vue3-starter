import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { api } from "~/api";
import type {
  UserDeleteEncryptedKeyParams as ApiParams,
  UserDeleteEncryptedKeyResponse as ApiResponse,
} from "~/models/user";

const mutationFn = async (payload: ApiParams) => {
  const response = await api.app.UserDeleteEncryptedKey<ApiResponse, ApiParams>(
    payload,
  );
  return response.params;
};

export const useUserDeleteEncryptedKey = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["UserGetEncryptedKey"] });
    },
  });
  return mutation;
};
