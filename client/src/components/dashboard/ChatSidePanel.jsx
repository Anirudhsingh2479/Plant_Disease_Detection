import { useState, useEffect, useRef } from "react";
import { 
  Drawer, 
  Box, 
  Typography, 
  IconButton, 
  TextField, 
  Button, 
  Stack, 
  CircularProgress,
  Tooltip,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import HistoryIcon from "@mui/icons-material/History";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../api/axiosInstance";
import FormattedMarkdownText from "../chat/FormattedMarkdownText";

const ChatSidePanel = ({ open, onClose, detectedDisease, sessionId: propSessionId }) => {
  const { t } = useTranslation();
  const chatEndRef = useRef(null);
  
  const [activeSessionId, setActiveSessionId] = useState(propSessionId || "");
  const [sessionTitle, setSessionTitle] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [showSessionsList, setShowSessionsList] = useState(false);
  const [pastSessions, setPastSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const eventSourceRef = useRef(null);

  // Sync propSessionId to activeSessionId when drawer opens or prop changes
  useEffect(() => {
    setActiveSessionId(propSessionId || "");
    setShowSessionsList(false);
  }, [propSessionId, open]);

  // Fetch past sessions list for history sidebar view
  const fetchPastSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await axiosInstance.get("/chat/sessions");
      const sessionList = Array.isArray(res.data?.sessions) ? res.data.sessions : [];
      setPastSessions(sessionList);
    } catch (err) {
      console.warn("Failed to fetch past chat sessions:", err);
      setPastSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleToggleHistoryView = () => {
    if (!showSessionsList) {
      fetchPastSessions();
    }
    setShowSessionsList((prev) => !prev);
  };

  const handleSelectSession = (sessionIdToLoad, title) => {
    setActiveSessionId(sessionIdToLoad);
    setSessionTitle(title || "");
    setShowSessionsList(false);
  };

  const handleStartNewChat = () => {
    const newId = `general_${Date.now()}`;
    setActiveSessionId(newId);
    setSessionTitle("New Plant Consultation");
    setMessages([
      {
        sender: "bot",
        text: t("chat.general_greet", {
          defaultValue: "Hi! I am your KrishiMitra AI plant disease assistant. How can I help you today?",
        }),
      },
    ]);
    setShowSessionsList(false);
  };

  // Fetch or initialize session-based chat history whenever activeSessionId changes
  useEffect(() => {
    let isMounted = true;

    const loadSessionChat = async () => {
      if (!open) return;

      // Reset current messages to avoid showing previous state
      setMessages([]);

      if (activeSessionId) {
        setIsFetchingHistory(true);
        try {
          const response = await axiosInstance.get(`/chat/history/${encodeURIComponent(activeSessionId)}`);
          const history = response.data?.history || [];
          const title = response.data?.title || "";

          if (isMounted) {
            setSessionTitle(title);
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
        } catch {
          if (isMounted) {
            if (detectedDisease) {
              setMessages([
                {
                  sender: "bot",
                  text: `Hi! I can see the detected disease is **${detectedDisease}**. Ask me any question!`,
                },
              ]);
            } else {
              setMessages([
                {
                  sender: "bot",
                  text: "Hi! How can I help you with your crop health today?",
                },
              ]);
            }
          }
        } finally {
          if (isMounted) setIsFetchingHistory(false);
        }
      } else {
        setSessionTitle("");
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
  }, [open, activeSessionId, detectedDisease, t]);

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

    const resolvedSessionId = activeSessionId || `user_session_${Date.now()}`;
    if (!activeSessionId) {
      setActiveSessionId(resolvedSessionId);
    }

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

      const langMap = { en: "English", hi: "Hindi", es: "Spanish" };
      const selectedLanguage = langMap[i18n.language] || "English";

      const fallbackToStandardChat = async () => {
        if (fallbackStarted || streamDone) return;
        fallbackStarted = true;
        try {
          const response = await axiosInstance.post("/chat", {
            user_message: userText,
            detected_disease: detectedDisease || null,
            session_id: resolvedSessionId,
            language: selectedLanguage,
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
        session_id: resolvedSessionId,
        language: selectedLanguage,
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
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 480 }, bgcolor: "#fbfdfa" } }}>
      {/* Header Bar */}
      <Box sx={{ p: 2, bgcolor: "#1b5e20", color: "white", display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {showSessionsList ? (
              <IconButton onClick={() => setShowSessionsList(false)} sx={{ color: "white", p: 0.5 }}>
                <ArrowBackIcon />
              </IconButton>
            ) : (
              <SmartToyIcon />
            )}
            <Typography variant="h6" fontWeight="700" sx={{ fontSize: "1.1rem" }}>
              {showSessionsList ? "Chat History" : t("chat.title", { defaultValue: "Plant Assistant" })}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip title="Start New Chat">
              <IconButton onClick={handleStartNewChat} sx={{ color: "white" }}>
                <AddIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={showSessionsList ? "Back to Chat" : "View Chat History"}>
              <IconButton onClick={handleToggleHistoryView} sx={{ color: showSessionsList ? "#a5d6a7" : "white" }}>
                <HistoryIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose} sx={{ color: "white" }}><CloseIcon /></IconButton>
          </Box>
        </Box>

        {/* Display Current Session Title */}
        {!showSessionsList && sessionTitle && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: "#a5d6a7", 
              fontWeight: 600, 
              overflow: "hidden", 
              textOverflow: "ellipsis", 
              whiteSpace: "nowrap",
              display: "block",
              maxWidth: 380,
              pl: 4
            }}
          >
            💬 {sessionTitle}
          </Typography>
        )}
      </Box>

      {/* Context Bar */}
      {!showSessionsList && detectedDisease && (
        <Box sx={{ p: 1.25, bgcolor: "#e8f5e9", textAlign: "center", borderBottom: "1px solid #c8e6c9" }}>
          <Typography variant="caption" sx={{ color: "#1b5e20", fontWeight: 600 }}>
            {t("chat.context", { defaultValue: "Context" })}: <b>{detectedDisease}</b>
          </Typography>
        </Box>
      )}

      {/* Main Content Body */}
      {showSessionsList ? (
        /* ChatGPT-Style History Sidebar List */
        <Box sx={{ flexGrow: 1, p: 2, overflowY: "auto", bgcolor: "#f4f7f4" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1b5e20" }}>
              Your Past Conversations
            </Typography>
            <Button
              size="small"
              variant="outlined"
              color="success"
              startIcon={<AddIcon />}
              onClick={handleStartNewChat}
              sx={{ borderRadius: 3, textTransform: "none", fontWeight: 700 }}
            >
              New Chat
            </Button>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {loadingSessions ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={28} color="success" />
            </Box>
          ) : !Array.isArray(pastSessions) || pastSessions.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
              <HistoryIcon sx={{ fontSize: 48, color: "#c8e6c9", mb: 1 }} />
              <Typography variant="body2">No past chat history found.</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {pastSessions.map((session) => {
                const isActive = session.sessionId === activeSessionId;
                const formattedDate = session.lastMessageAt ? new Date(session.lastMessageAt).toLocaleDateString() : "";
                return (
                  <Paper key={session.sessionId} elevation={0} sx={{ mb: 1.5, borderRadius: 2, border: isActive ? "2px solid #2e7d32" : "1px solid #e2e8f0" }}>
                    <ListItemButton
                      onClick={() => handleSelectSession(session.sessionId, session.title)}
                      sx={{ borderRadius: 2, flexDirection: "column", alignItems: "flex-start", p: 1.75 }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isActive ? "#2e7d32" : "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, pr: 1 }}>
                          {session.title || "Plant Consultation"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b", whiteSpace: "nowrap" }}>
                          {formattedDate}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", gap: 1, alignItems: "center", width: "100%" }}>
                        {session.detectedDisease && (
                          <Chip
                            label={session.detectedDisease}
                            size="small"
                            sx={{ height: 20, fontSize: "0.7rem", bgcolor: "#e8f5e9", color: "#1b5e20", fontWeight: 600 }}
                          />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {session.messageCount} messages
                        </Typography>
                      </Box>
                    </ListItemButton>
                  </Paper>
                );
              })}
            </List>
          )}
        </Box>
      ) : (
        /* Chat Messages Container */
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
      )}

      {/* Input Bar */}
      {!showSessionsList && (
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
      )}
    </Drawer>
  );
};

export default ChatSidePanel;
