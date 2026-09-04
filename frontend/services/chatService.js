import api from "./api";

export const sendMessage = async (
  message,
  sessionId = null,
  documentId = null,
  language = "English",
  file = null,
) => {
  if (!message || !message.trim()) {
    throw new Error("Message is required.");
  }

  const formData = new FormData();

  formData.append("message", message.trim());

  if (sessionId !== null && sessionId !== undefined) {
    formData.append("session_id", String(sessionId));
  }

  if (documentId !== null && documentId !== undefined) {
    formData.append("document_id", String(documentId));
  }

  formData.append("language", language);

  if (file) {
    formData.append("file", file);
  }
  console.log("[CHAT SERVICE DEBUG] file argument:", file);
  console.log("[CHAT SERVICE DEBUG] file name:", file?.name);
  console.log("[CHAT SERVICE DEBUG] file type:", file?.type);
  console.log("[CHAT SERVICE DEBUG] FormData file:", formData.get("file"));
  console.log(
    "[CHAT SERVICE DEBUG] FormData entries:",
    [...formData.entries()]
  );
  const response = await api.post("/chat/", formData);

  return response.data;
};

export const getChatMessages = async (sessionId) => {
  if (!sessionId) {
    throw new Error("Session ID is required.");
  }

  const response = await api.get(`/chat/${sessionId}`);
  return response.data;
};

export const getChatSessions = async () => {
  const response = await api.get("/chat/");
  return response.data;
};

export const deleteChatSession = async (sessionId) => {
  if (!sessionId) {
    throw new Error("Session ID is required.");
  }

  const response = await api.delete(`/chat/${sessionId}`);
  return response.data;
};