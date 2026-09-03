import api from "./api";

export const explainTopic = async (topic) => {
  if (!topic || !topic.trim()) {
    throw new Error("Topic is required.");
  }

  const response = await api.post("/explanation/", {
    topic: topic.trim(),
  });

  return response.data;
};