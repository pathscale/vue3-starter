import { useMutation } from "@tanstack/vue-query";
import { api } from "~/api";
import { $toast } from "~/main";
import type {
  UserS3CaptureEventParams as ApiParams,
  UserS3CaptureEventResponse as ApiResponse,
} from "~/models/user";

const mutationFn = async (payload: ApiParams) => {
  const response = await api.app.UserS3CaptureEvent<ApiResponse, ApiParams>(
    payload,
  );
  return response.params;
};

export const useUserS3CaptureEvent = () => {
  const mutation = useMutation({
    mutationFn,
    onSuccess: () => {
      $toast.success("Captured");
    },
  });
  return mutation;
};
