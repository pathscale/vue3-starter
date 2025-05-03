import { useMutation } from "@tanstack/vue-query";
import { api } from "~/api";
import { $toast } from "~/main";
import type {
  UserS3ReleasePositionParams as ApiParams,
  UserS3ReleasePositionResponse as ApiResponse,
} from "~/models/user";

const mutationFn = async (payload: ApiParams) => {
  const response = await api.app.UserS3ReleasePosition<ApiResponse, ApiParams>(
    payload,
  );
  return response.params;
};

export const useUserS3ReleasePosition = () => {
  const mutation = useMutation({
    mutationFn,
    onSuccess: () => {
      $toast.success("Cancelled");
    },
  });
  return mutation;
};
