# OFFSEDU — Consolidated AI Chat Improvement

Replace these files once as one consolidated update.

Implemented:
- SQL-backed conversation persistence.
- Restore the active conversation after route/page changes.
- SQL-backed chat history sidebar.
- Open previous conversations.
- Delete conversations.
- Active session ID remembered only in localStorage.
- Bounded SQL conversation history for Gemma.
- Lightweight intent routing without an extra LLM call.
- Lightweight language detection for English, Hindi/Marathi script, Urdu, and Hinglish.
- Conversation-aware RAG queries for references such as "this", "that", "again", and "previous".
- Chat attachment upload and document-grounded answering.
- RAG receives response language and recent conversation context.
- Gemma receives language and detected intent.
- Existing vector store and retriever are not changed.

Affected files:
- frontend/pages/Chat.jsx
- frontend/services/chatService.js
- backend/api/chat_routes.py
- backend/ai/chat_service.py
- backend/ai/prompts.py
- backend/ai/conversation_router.py
- backend/rag/context_builder.py
- backend/rag/rag_pipeline.py
- backend/rag/rag_service.py
