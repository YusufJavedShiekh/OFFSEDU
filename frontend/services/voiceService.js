import api from "./api";

export const getVoiceStatus = async () => {
  const response = await api.get("/voice/status");

  return response.data;
};

export const transcribeAudio = async (file) => {
  if (!file) {
    throw new Error("Audio file is required.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/voice/transcribe", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};