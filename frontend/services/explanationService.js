import api from "./api";

/**
 * Generate a complete explanation.
 */
export const explainTopic = async ({
  topic,
  documentId = null,
  language = "English",
  level = "Simple",
}) => {
  const response = await api.post("/explanation/", {
    topic,
    document_id: documentId,
    language,
    level,
  });

  return response.data;
};

/**
 * Stream an explanation progressively.
 *
 * This uses the browser Fetch API instead of Axios because
 * the response needs to be consumed as a readable stream.
 */
export const explainTopicStream = async ({
  topic,
  documentId = null,
  language = "English",
  level = "Simple",
  onChunk,
}) => {
  if (!topic || !topic.trim()) {
    throw new Error("Topic cannot be empty.");
  }

  const baseUrl =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:5000/api";

  console.log("EXPLANATION REQUEST:", {
    topic,
    documentId,
    language,
    level,
  });

  const response = await fetch(`${baseUrl}/explanation/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic,
      document_id: documentId,
      language,
      level,
    }),
  });

  if (!response.ok) {
    let message = "Unable to generate explanation.";

    try {
      const errorData = await response.json();

      message =
        errorData?.error ||
        errorData?.message ||
        message;
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  if (!response.body) {
    throw new Error(
      "Streaming is not supported by this browser."
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, {
        stream: true,
      });

      const lines = buffer.split("\n");

      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
          continue;
        }

        try {
          const data = JSON.parse(trimmedLine);

          if (data?.error) {
            throw new Error(data.error);
          }

          if (data?.chunk && typeof onChunk === "function") {
            onChunk(data.chunk);
          }

          if (
            data?.done &&
            typeof data?.explanation === "string" &&
            typeof onChunk === "function"
          ) {
            onChunk(data.explanation);
          }
        } catch (error) {
          if (
            error instanceof Error &&
            error.message !==
              "Unexpected end of JSON input"
          ) {
            throw error;
          }
        }
      }
    }

    buffer += decoder.decode();

    const finalLine = buffer.trim();

    if (finalLine) {
      try {
        const data = JSON.parse(finalLine);

        if (data?.error) {
          throw new Error(data.error);
        }

        if (
          data?.chunk &&
          typeof onChunk === "function"
        ) {
          onChunk(data.chunk);
        }
      } catch {
        // Ignore incomplete trailing stream data.
      }
    }
  } finally {
    reader.releaseLock();
  }
};