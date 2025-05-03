import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { api } from "~/api";
import { $toast } from "~/main";
import type {
  UserDecryptEncryptedKeyParams as ApiParams,
  UserDecryptEncryptedKeyResponse as ApiResponse,
} from "~/models/user";

const mutationFn = async (payload: ApiParams) => {
  const response = await api.app.UserDecryptEncryptedKey<
    ApiResponse,
    ApiParams
  >(payload);
  return response.params;
};

export const useUserDecryptEncryptedKey = () => {
  const mutation = useMutation({
    mutationFn,
    onSuccess: () => {
      $toast.success("Decrypted");
    },
  });
  return mutation;
};
