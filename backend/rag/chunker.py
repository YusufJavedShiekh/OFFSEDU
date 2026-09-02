# ============================================================
# OFFSEDU RAG - Text Chunker
# ============================================================


class TextChunker:
    """Split document text into manageable chunks for RAG."""

    def __init__(
        self,
        chunk_size=1000,
        chunk_overlap=200,
    ):
        if chunk_size <= 0:
            raise ValueError("chunk_size must be greater than 0.")

        if chunk_overlap < 0:
            raise ValueError("chunk_overlap cannot be negative.")

        if chunk_overlap >= chunk_size:
            raise ValueError(
                "chunk_overlap must be smaller than chunk_size."
            )

        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split_text(self, text):
        """Split text into overlapping chunks."""

        if not text or not text.strip():
            return []

        text = text.strip()

        chunks = []
        start = 0
        text_length = len(text)

        while start < text_length:
            end = start + self.chunk_size

            chunk = text[start:end].strip()

            if chunk:
                chunks.append(chunk)

            if end >= text_length:
                break

            start = end - self.chunk_overlap

        return chunks


text_chunker = TextChunker()
