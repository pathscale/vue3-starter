import { useMutation } from "@tanstack/vue-query";

const useLogout = () => {
  const mutation = useMutation({
    mutationFn: async () => {},
  });
  return mutation;
};

export { useLogout };
