# ============================================================
# OFFSEDU RAG - Context Builder
# ============================================================


class ContextBuilder:
    """Build clean context from retrieved document chunks."""

    def __init__(self, max_chunks=5):
        if max_chunks < 1:
            raise ValueError("max_chunks must be at least 1.")
        self.max_chunks = max_chunks

    def build(self, retrieved_chunks, use_all=False):
        if not retrieved_chunks:
            return ""

        chunks = retrieved_chunks if use_all else retrieved_chunks[:self.max_chunks]
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

            context_parts.append(f"[Source {index}: {source}]\n{document}")

        return "\n\n".join(context_parts)

    def build_prompt(
        self,
        question,
        retrieved_chunks,
        use_all=False,
        language="English",
        conversation_context="",
    ):
        context = self.build(retrieved_chunks, use_all=use_all)

        if not context:
            return question.strip()

        history_section = (
            f"\nRECENT CONVERSATION CONTEXT:\n{conversation_context}\n"
            if conversation_context
            else ""
        )

        return f"""
Use the following document context to answer the student's question.

DOCUMENT CONTEXT:
{context}
{history_section}
STUDENT QUESTION:
{question.strip()}

RESPONSE LANGUAGE:
{language}

Instructions:
- Use the document context as the primary source.
- Use recent conversation context only to resolve references.
- Answer only what is relevant.
- Do not invent information unsupported by the document.
- If the context is insufficient, clearly say so.
- Answer in the requested/current language.
- Explain clearly for a student.
"""


context_builder = ContextBuilder()
