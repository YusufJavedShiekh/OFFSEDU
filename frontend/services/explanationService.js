import api from "./api";

export const explainTopic = async ({
  topic,
  documentId = null,
  language = "English",
  level = "Simple",
}) => {
  if (!topic || !topic.trim()) {
    throw new Error("Topic is required.");
  }

  const response = await api.post("/explanation/", {
    topic: topic.trim(),
    document_id: documentId,
    language,
    level,
  });

  return response.data;
};