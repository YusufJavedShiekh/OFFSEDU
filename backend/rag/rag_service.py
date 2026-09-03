# ============================================================
# OFFSEDU RAG - RAG Service
# ============================================================

from rag.rag_pipeline import rag_pipeline


class RAGService:
    """Service layer for OFFSEDU Retrieval-Augmented Generation."""

    def __init__(self, pipeline=None):
        self.pipeline = pipeline or rag_pipeline

    def add_document(self, text, metadata=None):
        """Process and store a document in the RAG knowledge base."""

        if not text or not text.strip():
            raise ValueError("Document text cannot be empty.")

        return self.pipeline.index_document(
            text=text,
            metadata=metadata,
        )

    def search(self, query, top_k=5, document_id=None):
        """Retrieve relevant document chunks."""

        if not query or not query.strip():
            raise ValueError("Query cannot be empty.")

        return self.pipeline.retrieve(
            question=query,
            top_k=top_k,
            document_id=document_id,
        )

    def get_document_chunks(self, document_id):
        """Retrieve all chunks belonging to a specific document."""

        if not document_id:
            raise ValueError("Document ID is required.")

        return self.pipeline.retriever.retrieve_all(
            document_id=document_id
        )

    def ask(self, question, top_k=5, document_id=None):
        """Answer a question using retrieved document context."""

        if not question or not question.strip():
            raise ValueError("Question cannot be empty.")

        return self.pipeline.answer(
            question=question,
            top_k=top_k,
            document_id=document_id,
        )

    def index_document(self, text, metadata=None):
        """Alias for add_document."""

        return self.add_document(
            text=text,
            metadata=metadata,
        )


rag_service = RAGService()