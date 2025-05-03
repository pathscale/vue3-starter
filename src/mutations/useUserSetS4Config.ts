import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { api } from "~/api";
import { $toast } from "~/main";
import type {
  UserSetS4ConfigParams as ApiParams,
  UserSetS4ConfigResponse as ApiResponse,
} from "~/models/user";

const mutationFn = async (payload: ApiParams) => {
  const response = await api.app.UserSetS4Config<ApiResponse, ApiParams>(
    payload,
  );
  return response.params;
};

export const useUserSetS4Config = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["UserGetConfig"] });
      $toast.success("Updated!");
    },
    onError: (error: Error) => {
      $toast.error(error.message);
    },
  });

  return mutation;
};
