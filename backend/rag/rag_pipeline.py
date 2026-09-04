# ============================================================
# OFFSEDU RAG - RAG Pipeline
# ============================================================

import uuid

from rag.chunker import text_chunker
from rag.embeddings import embedding_service
from rag.vector_store import vector_store
from rag.retriever import retriever
from rag.context_builder import context_builder
from ai.gemma_service import gemma_service


class RAGPipeline:
    """Complete Retrieval-Augmented Generation pipeline."""

    def __init__(
        self,
        chunker=None,
        embedding_service_instance=None,
        vector_store_instance=None,
        retriever_instance=None,
        context_builder_instance=None,
        ai_service=None,
    ):
        self.chunker = chunker or text_chunker
        self.embedding_service = embedding_service_instance or embedding_service
        self.vector_store = vector_store_instance or vector_store
        self.retriever = retriever_instance or retriever
        self.context_builder = context_builder_instance or context_builder
        self.ai_service = ai_service or gemma_service

    def index_document(self, text, metadata=None):
        if not text or not text.strip():
            raise ValueError("Document text cannot be empty.")

        chunks = self.chunker.split_text(text)
        if not chunks:
            return []

        embeddings = self.embedding_service.embed_many(chunks)
        document_ids = [str(uuid.uuid4()) for _ in chunks]

        chunk_metadatas = []
        for index in range(len(chunks)):
            metadata_item = dict(metadata or {})
            metadata_item["chunk_index"] = index
            chunk_metadatas.append(metadata_item)

        self.vector_store.add_documents(
            documents=chunks,
            embeddings=embeddings,
            ids=document_ids,
            metadatas=chunk_metadatas,
        )

        return document_ids

    def retrieve(self, question, top_k=5, document_id=None):
        if not question or not question.strip():
            raise ValueError("Question cannot be empty.")

        return self.retriever.retrieve(
            query=question,
            top_k=top_k,
            document_id=document_id,
        )

    def answer(
        self,
        question,
        top_k=5,
        document_id=None,
        language="English",
        conversation_context="",
    ):
        if not question or not question.strip():
            raise ValueError("Question cannot be empty.")

        retrieved_chunks = self.retrieve(
            question=question,
            top_k=top_k,
            document_id=document_id,
        )

        prompt = self.context_builder.build_prompt(
            question=question,
            retrieved_chunks=retrieved_chunks,
            language=language,
            conversation_context=conversation_context,
        )

        return {
            "answer": self.ai_service.generate(prompt),
            "sources": retrieved_chunks,
        }


rag_pipeline = RAGPipeline()
