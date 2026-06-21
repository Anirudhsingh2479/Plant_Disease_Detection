import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      chat: {
        title: "Plant Assistant",
        context: "Context",
        placeholder: "Ask about plant disease, prevention, or treatment...",
        error: "Sorry, I couldn't process that request. Please try again.",
        general_greet: "Hi! I am your plant disease assistant. How can I help you today?",
        scan_greet: "Hi! I can see the detected disease is {{disease}}. What would you like to know?"
      }
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
