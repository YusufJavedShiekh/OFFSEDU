import api from "./api";

export const generateQuiz = async ({
  topic,
  numQuestions = 5,
  documentId = null,
  difficulty = "Medium",
  language = "English",
}) => {
  if (!topic || !topic.trim()) {
    throw new Error("Topic is required.");
  }

  const response = await api.post("/quiz/", {
    topic: topic.trim(),
    num_questions: Number(numQuestions),
    document_id: documentId,
    difficulty,
    language,
  });

  return response.data;
};