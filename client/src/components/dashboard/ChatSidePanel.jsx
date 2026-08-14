import { useState, useEffect, useRef } from "react";
import { Drawer, Box, Typography, IconButton, TextField, Button, Stack, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../api/axiosInstance";
import FormattedMarkdownText from "../chat/FormattedMarkdownText";

const ChatSidePanel = ({ open, onClose, detectedDisease, sessionId }) => {
  const { t } = useTranslation();
  const chatEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const eventSourceRef = useRef(null);

  // Fetch or initialize session-based chat history
  useEffect(() => {
    let isMounted = true;

    const loadSessionChat = async () => {
      if (!open) return;

      if (sessionId) {
        setIsFetchingHistory(true);
        try {
          const response = await axiosInstance.get(`/chat/history/${encodeURIComponent(sessionId)}`);
          const history = response.data?.history || [];

          if (isMounted) {
            if (history.length > 0) {
              setMessages(history.map((m) => ({ sender: m.sender, text: m.text })));
            } else if (detectedDisease) {
              setMessages([
                {
                  sender: "bot",
                  text: t("chat.scan_greet", {
                    disease: detectedDisease,
                    defaultValue: `Hi! I can see the detected disease is **${detectedDisease}**. What would you like to know about treatment, precautions, or fruit impact?`,
                  }),
                },
              ]);
            }
          }
        } catch {
          if (isMounted && detectedDisease) {
            setMessages([
              {
                sender: "bot",
                text: `Hi! I can see the detected disease is **${detectedDisease}**. Ask me any question!`,
              },
            ]);
          }
        } finally {
          if (isMounted) setIsFetchingHistory(false);
        }
      } else {
        if (detectedDisease) {
          setMessages([
            {
              sender: "bot",
              text: t("chat.scan_greet", {
                disease: detectedDisease,
                defaultValue: `Hi! I can see the detected disease is **${detectedDisease}**. What would you like to know?`,
              }),
            },
          ]);
        } else {
          setMessages([
            {
              sender: "bot",
              text: t("chat.general_greet", {
                defaultValue: "Hi! I am your KrishiMitra AI plant disease assistant. How can I help you today?",
              }),
            },
          ]);
        }
      }
    };

    loadSessionChat();

    return () => {
      isMounted = false;
    };
  }, [open, sessionId, detectedDisease, t]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInput("");
    setIsLoading(true);

    const activeSessionId = sessionId || `user_session_${Date.now()}`;

    try {
      setMessages((prev) => [...prev, { sender: "bot", text: "" }]);
      let streamDone = false;
      let fallbackStarted = false;

      const applyBotText = (text) => {
        setMessages((prev) => {
          if (!prev.length) return prev;
          const next = [...prev];
          const lastIndex = next.length - 1;
          if (next[lastIndex].sender === "bot") {
            next[lastIndex] = { ...next[lastIndex], text };
            return next;
          }
          return [...next, { sender: "bot", text }];
        });
      };

      const fallbackToStandardChat = async () => {
        if (fallbackStarted || streamDone) return;
        fallbackStarted = true;
        try {
          const response = await axiosInstance.post("/chat", {
            user_message: userText,
            detected_disease: detectedDisease || null,
            session_id: activeSessionId,
          });

          const botText = response?.data?.bot_response;
          if (typeof botText === "string" && botText.trim()) {
            applyBotText(botText);
          } else {
            applyBotText("Sorry, I couldn't process that request. Please try again.");
          }
        } catch {
          applyBotText("Sorry, I couldn't process that request. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const params = new URLSearchParams({
        user_message: userText,
        detected_disease: detectedDisease || "",
        session_id: activeSessionId,
      });

      const eventSource = new EventSource(`${import.meta.env.VITE_API_BASE_URL}/chat/stream?${params.toString()}`, {
        withCredentials: true,
      });

      eventSourceRef.current = eventSource;

      eventSource.addEventListener("token", (event) => {
        try {
          const payload = JSON.parse(event.data);
          const token = payload?.text || "";

          if (!token) return;

          setMessages((prev) => {
            if (!prev.length) return prev;
            const next = [...prev];
            const lastIndex = next.length - 1;
            if (next[lastIndex].sender !== "bot") return prev;
            next[lastIndex] = {
              ...next[lastIndex],
              text: `${next[lastIndex].text}${token}`,
            };
            return next;
          });
        } catch {
          // Keep stream alive
        }
      });

      eventSource.addEventListener("done", () => {
        streamDone = true;
        setIsLoading(false);
        eventSource.close();
        eventSourceRef.current = null;
      });

      eventSource.addEventListener("error", async (event) => {
        if (streamDone) return;

        if (event?.data) {
          try {
            const payload = JSON.parse(event.data);
            const message = payload?.message;
            if (message) {
              applyBotText(message);
              setIsLoading(false);
              eventSource.close();
              eventSourceRef.current = null;
              return;
            }
          } catch {
            // Fall back
          }
        }

        eventSource.close();
        eventSourceRef.current = null;
        await fallbackToStandardChat();
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, I couldn't process that request. Please try again.",
        },
      ]);
      setIsLoading(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 460 }, bgcolor: "#fbfdfa" } }}>
      <Box sx={{ p: 2, bgcolor: "#1b5e20", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SmartToyIcon />
          <Typography variant="h6" fontWeight="700">
            {t("chat.title", { defaultValue: "Plant Assistant" })}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "white" }}><CloseIcon /></IconButton>
      </Box>

      {detectedDisease && (
        <Box sx={{ p: 1.5, bgcolor: "#e8f5e9", textAlign: "center", borderBottom: "1px solid #c8e6c9" }}>
          <Typography variant="caption" sx={{ color: "#1b5e20", fontWeight: 600 }}>
            {t("chat.context", { defaultValue: "Context" })}: <b>{detectedDisease}</b>
          </Typography>
        </Box>
      )}

      <Box sx={{ flexGrow: 1, p: 2, overflowY: "auto", bgcolor: "#f4f7f4" }}>
        {isFetchingHistory ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} color="success" />
          </Box>
        ) : (
          <Stack spacing={2}>
            {messages.map((msg, i) => (
              <Box
                key={i}
                sx={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  bgcolor: msg.sender === "user" ? "#1b5e20" : "#ffffff",
                  color: msg.sender === "user" ? "white" : "#0f172a",
                  p: 1.75,
                  borderRadius: 3,
                  maxWidth: "88%",
                  boxShadow: msg.sender === "user" ? "0 2px 8px rgba(27, 94, 32, 0.2)" : "0 2px 8px rgba(0,0,0,0.05)",
                  border: msg.sender === "user" ? "none" : "1px solid #e2e8f0",
                }}
              >
                {msg.sender === "user" ? (
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.5, fontSize: "0.875rem" }}>
                    {msg.text}
                  </Typography>
                ) : (
                  <FormattedMarkdownText text={msg.text} />
                )}
              </Box>
            ))}
            {isLoading && (
              <Box sx={{ alignSelf: "flex-start", bgcolor: "#ffffff", p: 1.5, borderRadius: 3, border: "1px solid #e2e8f0" }}>
                <CircularProgress size={18} color="success" />
              </Box>
            )}
            <div ref={chatEndRef} />
          </Stack>
        )}
      </Box>

      <Box sx={{ p: 2, display: "flex", gap: 1, bgcolor: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t("chat.placeholder", {
            defaultValue: "Ask about plant disease, prevention, or treatment...",
          })}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        />
        <Button
          variant="contained"
          color="success"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          sx={{ borderRadius: 3, px: 2.5, bgcolor: "#1b5e20", '&:hover': { bgcolor: "#0f2e22" } }}
        >
          <SendIcon fontSize="small" />
        </Button>
      </Box>
    </Drawer>
  );
};

export default ChatSidePanel;
