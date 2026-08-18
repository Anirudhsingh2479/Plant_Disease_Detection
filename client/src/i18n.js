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
      },
      nav: {
        dashboard: "Dashboard",
        profile: "Profile",
        logout: "Logout",
        language: "Language"
      }
    }
  },
  hi: {
    translation: {
      chat: {
        title: "कृषि-मित्र एआई सहायक",
        context: "संदर्भ रोग",
        placeholder: "पौधों की बीमारी, रोकथाम या उपचार के बारे में पूछें...",
        error: "क्षमा करें, अनुरोध संसाधित नहीं हो सका। कृपया पुनः प्रयास करें।",
        general_greet: "नमस्ते! मैं आपका फसल स्वास्थ्य सहायक हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?",
        scan_greet: "नमस्ते! पहचाना गया रोग {{disease}} है। आप इसके उपचार या बचाव के बारे में क्या जानना चाहते हैं?"
      },
      nav: {
        dashboard: "डैशबोर्ड",
        profile: "प्रोफ़ाइल",
        logout: "लॉग आउट",
        language: "भाषा"
      }
    }
  },
  es: {
    translation: {
      chat: {
        title: "Asistente de Plantas",
        context: "Enfermedad",
        placeholder: "Pregunte sobre enfermedades, prevención o tratamiento...",
        error: "Lo sentimos, no se pudo procesar la solicitud.",
        general_greet: "¡Hola! Soy tu asistente agrícola. ¿Cómo puedo ayudarte hoy?",
        scan_greet: "¡Hola! La enfermedad detectada es {{disease}}. ¿Qué deseas consultar?"
      },
      nav: {
        dashboard: "Panel",
        profile: "Perfil",
        logout: "Cerrar sesión",
        language: "Idioma"
      }
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("app_lang") || "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
