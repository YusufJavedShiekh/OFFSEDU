
import api from "./api";

export const getDocuments = async () => {
  const response = await api.get("/documents/");
  return response.data;
};

export const uploadDocument = async (file) => {
  if (!file) {
    throw new Error("File is required.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};