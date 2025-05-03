import { useMutation } from "@tanstack/vue-query";

export const useTelegramRegister = () => {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  const WEB_HOOK_SERVER = process.env.WEB_HOOK_SERVER;
  const mutationFn = async () => {
    // register webhook
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`);
    // listen for webhook
    await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${WEB_HOOK_SERVER}`,
    );
    // check webhook
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    // delete webhook
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`);
  };
  const mutation = useMutation({ mutationFn });
  return mutation;
};
