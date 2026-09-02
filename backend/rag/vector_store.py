# ============================================================
# OFFSEDU RAG - ChromaDB Vector Store
# ============================================================

import chromadb


class VectorStore:
    """Store and search document embeddings using ChromaDB."""

    def __init__(
        self,
        persist_directory="data/chroma/database",
        collection_name="offsedu_documents",
    ):
        self.client = chromadb.PersistentClient(
            path=persist_directory
        )

        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={
                "description": "OFFSEDU document knowledge base"
            },
        )

    def add_documents(
        self,
        documents,
        embeddings,
        ids,
        metadatas=None,
    ):
        """Add document chunks and their embeddings to ChromaDB."""

        if not documents:
            raise ValueError("Documents cannot be empty.")

        if not embeddings:
            raise ValueError("Embeddings cannot be empty.")

        if not ids:
            raise ValueError("IDs cannot be empty.")

        if not (
            len(documents)
            == len(embeddings)
            == len(ids)
        ):
            raise ValueError(
                "Documents, embeddings, and IDs must have "
                "the same length."
            )

        self.collection.add(
            documents=documents,
            embeddings=embeddings,
            ids=ids,
            metadatas=metadatas,
        )

    def search(self, query_embedding, top_k=5):
        """Find the most relevant document chunks."""

        if not query_embedding:
            raise ValueError("Query embedding cannot be empty.")

        if top_k < 1:
            raise ValueError("top_k must be at least 1.")

        return self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
        )

    def delete(self, ids):
        """Delete document chunks by their IDs."""

        if not ids:
            return

        self.collection.delete(ids=ids)

    def count(self):
        """Return the number of stored document chunks."""

        return self.collection.count()


vector_store = VectorStore()
