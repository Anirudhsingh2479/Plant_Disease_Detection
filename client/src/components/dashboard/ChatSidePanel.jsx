import React, { useState, useEffect, useRef } from "react";
import { Drawer, Box, Typography, IconButton, TextField, Button, Divider, Stack, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import axios from "axios";
import { useTranslation } from "react-i18next";

const ChatSidePanel = ({ open, onClose, detectedDisease }) => {
  const { t } = useTranslation();
  const chatEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Greeting Logic: Auto-detect if this is a diagnostic session or general chat
  useEffect(() => {
    if (open) {
      if (detectedDisease) {
        setMessages([{ sender: "bot", text: t("chat.scan_greet", { disease: detectedDisease }) }]);
      } else {
        setMessages([{ sender: "bot", text: t("chat.general_greet") }]);
      }
    }
  }, [open, detectedDisease, t]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/api/chat", {
        user_message: userText,
        detected_disease: detectedDisease || null // Backend handles null fine
      });
      setMessages((prev) => [...prev, { sender: "bot", text: response.data.bot_response }]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "bot", text: t("chat.error") }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 450 }, bgcolor: "#fbfdfa" } }}>
      <Box sx={{ p: 2, bgcolor: "#1b5e20", color: "white", display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6"><SmartToyIcon /> {t("chat.title")}</Typography>
        <IconButton onClick={onClose} sx={{ color: "white" }}><CloseIcon /></IconButton>
      </Box>

      {detectedDisease && (
        <Box sx={{ p: 1.5, bgcolor: "#e8f5e9", textAlign: "center" }}>
          <Typography variant="caption">{t("chat.context")}: <b>{detectedDisease}</b></Typography>
        </Box>
      )}

      <Box sx={{ flexGrow: 1, p: 2, overflowY: "auto", bgcolor: "#f4f7f4" }}>
        <Stack spacing={2}>
          {messages.map((msg, i) => (
            <Box key={i} sx={{ alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", bgcolor: msg.sender === "user" ? "#1b5e20" : "#ffffff", color: msg.sender === "user" ? "white" : "black", p: 1.5, borderRadius: 2, maxWidth: "85%" }}>
              <Typography variant="body2">{msg.text}</Typography>
            </Box>
          ))}
          {isLoading && <CircularProgress size={20} color="success" />}
          <div ref={chatEndRef} />
        </Stack>
      </Box>

      <Box sx={{ p: 2, display: "flex", gap: 1 }}>
        <TextField fullWidth size="small" placeholder={t("chat.placeholder")} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} />
        <Button variant="contained" color="success" onClick={handleSend}><SendIcon /></Button>
      </Box>
    </Drawer>
  );
};

export default ChatSidePanel;