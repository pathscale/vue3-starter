import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { api } from "~/api";
import type {
  UserRemoveBlacklistParams as ApiParams,
  UserRemoveBlacklistResponse as ApiResponse,
} from "~/models/user";

const mutationFn = async (payload: ApiParams) => {
  const response = await api.app.UserRemoveBlacklist<ApiResponse, ApiParams>(
    payload,
  );
  return response.params;
};

export const useUserRemoveBlacklist = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["UserGetBlacklist"] });
      queryClient.invalidateQueries({ queryKey: ["UserGetSymbolList"] });
    },
  });
  return mutation;
};
