import api from "./api";

export const getUtilityHealth = async () => {
  const response = await api.get("/utility/health");

  return response.data;
};