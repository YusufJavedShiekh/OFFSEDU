# ============================================================
# OFFSEDU RAG - Context Builder
# ============================================================


class ContextBuilder:
    """Build clean context from retrieved document chunks."""

    def __init__(self, max_chunks=5):
        if max_chunks < 1:
            raise ValueError("max_chunks must be at least 1.")

        self.max_chunks = max_chunks

    def build(self, retrieved_chunks):
        """Build a context string from retrieved chunks."""

        if not retrieved_chunks:
            return ""

        chunks = retrieved_chunks[:self.max_chunks]

        context_parts = []

        for index, chunk in enumerate(chunks, start=1):
            document = chunk.get("document", "").strip()

            if not document:
                continue

            metadata = chunk.get("metadata") or {}

            source = metadata.get(
                "filename",
                metadata.get("source", "Unknown source"),
            )

            context_parts.append(
                f"[Source {index}: {source}]\n"
                f"{document}"
            )

        return "\n\n".join(context_parts)

    def build_prompt(self, question, retrieved_chunks):
        """Build a prompt containing the question and retrieved context."""

        context = self.build(retrieved_chunks)

        if not context:
            return question.strip()

        return f"""
Use the following document context to answer the student's question.

DOCUMENT CONTEXT:
{context}

STUDENT QUESTION:
{question.strip()}

Instructions:
- Use the document context as the primary source.
- Answer only what is relevant to the question.
- Do not invent information that is not supported by the context.
- If the context does not contain enough information, clearly say so.
- Explain the answer clearly for a student.
"""


context_builder = ContextBuilder()
