import { useMutation } from "@tanstack/vue-query";
import { useLogin, type LoginParams } from "./useLogin";
interface ISignup extends LoginParams {
  email: string;
  agreedPrivacy: boolean;
  agreedTos: boolean;
}

const useSignup = () => {
  const { login } = useLogin();
  const mutation = useMutation({
    mutationFn: async (payload: ISignup) => {
      await login.mutateAsync(payload);
    },
  });
  return mutation;
};

export { useSignup };
