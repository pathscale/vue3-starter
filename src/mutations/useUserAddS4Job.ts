import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { api } from "~/api";
import type { UserAddS4JobParams as ApiParams } from "~/models/user";

const mutateFn = async (params: ApiParams) => {
  await api.app.UserAddS4Job<void, ApiParams>(params);
};

export const useUserAddS4Job = () => {
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
