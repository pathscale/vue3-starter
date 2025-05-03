import { useMutation } from "@tanstack/vue-query";
import { api } from "~/api";
import { $toast } from "~/main";
import type {
  UserClosePositionResponse as ApiResponse,
  UserClosePositionParams,
} from "~/models/user";

interface ApiParams extends UserClosePositionParams {
  strategyId: number;
}

const mutationFn = async (payload: ApiParams) => {
  if (payload.strategyId === 1) {
    const response = await api.app.UserCancelOrClosePosition<
      ApiResponse,
      ApiParams
    >(payload);
    return response.params;
  }
  if (payload.strategyId === 2) {
    const response = await api.app.UserS2ClosePosition<ApiResponse, ApiParams>(
      payload,
    );
    return response.params;
  }
  if (payload.strategyId === 3) {
    const response = await api.app.UserClosePosition<ApiResponse, ApiParams>(
      payload,
    );
    return response.params;
  }
};

export const useUserCancelOrClosePosition = () => {
  const mutation = useMutation({
    mutationFn,
    onSuccess: () => {
      $toast.success("Success");
    },
  });
  return mutation;
};
