import api from "./api";

export const sendMessage = async (message, sessionId = null) => {
  if (!message || !message.trim()) {
    throw new Error("Message is required.");
  }

  const response = await api.post("/chat/", {
    message: message.trim(),
    session_id: sessionId,
  });

  return response.data;
};