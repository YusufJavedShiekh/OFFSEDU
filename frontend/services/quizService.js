import api from "./api";

export const generateQuiz = async (topic, numQuestions = 5) => {
  if (!topic || !topic.trim()) {
    throw new Error("Topic is required.");
  }

  const response = await api.post("/quiz/", {
    topic: topic.trim(),
    num_questions: Number(numQuestions),
  });

  return response.data;
};