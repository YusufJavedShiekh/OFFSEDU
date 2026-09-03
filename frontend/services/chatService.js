import api from "./api";

export const sendMessage = async (message) => {
  if (!message || !message.trim()) {
    throw new Error("Message is required.");
  }

  const response = await api.post("/chat/", {
    message: message.trim(),
  });

  return response.data;
};