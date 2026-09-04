# ============================================================
# OFFSEDU RAG - RAG Service
# ============================================================

from rag.rag_pipeline import rag_pipeline


class RAGService:
    """Service layer for OFFSEDU Retrieval-Augmented Generation."""

    def __init__(self, pipeline=None):
        self.pipeline = pipeline or rag_pipeline

    def add_document(self, text, metadata=None):
        if not text or not text.strip():
            raise ValueError("Document text cannot be empty.")
        return self.pipeline.index_document(text=text, metadata=metadata)

    def search(self, query, top_k=5, document_id=None):
        if not query or not query.strip():
            raise ValueError("Query cannot be empty.")
        return self.pipeline.retrieve(
            question=query,
            top_k=top_k,
            document_id=document_id,
        )

    def get_document_chunks(self, document_id):
        if not document_id:
            raise ValueError("Document ID is required.")
        return self.pipeline.retriever.retrieve_all(document_id=document_id)

    def ask(
        self,
        question,
        top_k=5,
        document_id=None,
        language="English",
        conversation_context="",
    ):
        if not question or not question.strip():
            raise ValueError("Question cannot be empty.")

        return self.pipeline.answer(
            question=question,
            top_k=top_k,
            document_id=document_id,
            language=language,
            conversation_context=conversation_context,
        )

    def index_document(self, text, metadata=None):
        return self.add_document(text=text, metadata=metadata)


rag_service = RAGService()
