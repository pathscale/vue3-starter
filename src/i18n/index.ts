import { createI18n } from "vue-i18n";
import en from "./locales/en.json";

const messages = {
  en,
};

const i18n = createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages,
});

const { t } = i18n.global;

export { t };

export default i18n;
