# ============================================================
# OFFSEDU RAG - Retriever
# ============================================================

from rag.embeddings import embedding_service
from rag.vector_store import vector_store


class Retriever:
    """Retrieve relevant document chunks for a user query."""

    def __init__(
        self,
        embedding_service_instance=None,
        vector_store_instance=None,
    ):
        self.embedding_service = (
            embedding_service_instance or embedding_service
        )

        self.vector_store = (
            vector_store_instance or vector_store
        )

    def retrieve(self, query, top_k=5):
        """Retrieve the most relevant chunks for a query."""

        if not query or not query.strip():
            raise ValueError("Query cannot be empty.")

        query_embedding = self.embedding_service.embed(
            query.strip()
        )

        results = self.vector_store.search(
            query_embedding=query_embedding,
            top_k=top_k,
        )

        return self._format_results(results)

    @staticmethod
    def _format_results(results):
        """Convert ChromaDB results into a simpler structure."""

        if not results:
            return []

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]
        ids = results.get("ids", [[]])[0]

        formatted = []

        for index, document in enumerate(documents):
            formatted.append({
                "id": ids[index] if index < len(ids) else None,
                "document": document,
                "metadata": (
                    metadatas[index]
                    if index < len(metadatas)
                    else {}
                ),
                "distance": (
                    distances[index]
                    if index < len(distances)
                    else None
                ),
            })

        return formatted


retriever = Retriever()
