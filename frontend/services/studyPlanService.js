import api from "./api";

export const generateStudyPlan = async (topic, duration) => {
  if (!topic || !topic.trim()) {
    throw new Error("Topic is required.");
  }

  if (duration === undefined || duration === null || !String(duration).trim()) {
    throw new Error("Duration is required.");
  }

  const response = await api.post("/study-plans/", {
    topic: topic.trim(),
    duration: String(duration).trim(),
  });

  return response.data;
};

export const getStudyPlans = async () => {
  const response = await api.get("/study-plans/");

  return response.data;
};