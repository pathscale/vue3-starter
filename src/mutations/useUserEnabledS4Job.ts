import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { api } from "~/api";
import type {
  UserEnabledS4JobParams as ApiParams,
  UserEnabledS4JobResponse as ApiResponse,
} from "~/models/user";

const mutateFn = async (params: ApiParams) => {
  await api.app.UserEnabledS4Job<ApiResponse, ApiParams>(params);
};

export const useUserEnabledS4Job = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: mutateFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["UserListS4Jobs"],
      });
    },
  });
  return mutation;
};
