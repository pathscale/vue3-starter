import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { api } from "~/api";
import type {
  UserAddBlacklistParams as ApiParams,
  UserAddBlacklistResponse as ApiResponse,
} from "~/models/user";

const mutationFn = async (payload: ApiParams) => {
  const response = await api.app.UserAddBlacklist<ApiResponse, ApiParams>(
    payload,
  );
  return response.params;
};

export const useUserAddBlacklist = () => {
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
