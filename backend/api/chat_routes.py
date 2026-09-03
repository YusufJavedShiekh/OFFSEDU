from flask import Blueprint, jsonify, request

from ai.chat_service import chat_service

chat_bp = Blueprint(
    "chat",
    __name__,
    url_prefix="/api/chat"
)

# ChromaDB cosine distance: lower = more similar.
# This prevents weak/unrelated document matches from forcing RAG mode.
RAG_DISTANCE_THRESHOLD = 0.65


def _has_relevant_sources(sources):
    """Return True when at least one retrieved chunk is sufficiently relevant."""
    if not sources:
        return False

    for source in sources:
        distance = source.get("distance")

        if distance is None:
            continue

        try:
            if float(distance) <= RAG_DISTANCE_THRESHOLD:
                return True
        except (TypeError, ValueError):
            continue

    return False


@chat_bp.route("/", methods=["POST"])
def chat():
    """Handle student chat requests."""

    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()

    if not message:
        return jsonify({
            "success": False,
            "error": "Message is required"
        }), 400

    try:
        # Try RAG first.
        try:
            from rag.rag_service import rag_service

            result = rag_service.ask(
                question=message,
                top_k=5
            )

            sources = result.get("sources", [])

            # Only use RAG when the retrieved context is actually relevant.
            if _has_relevant_sources(sources):
                return jsonify({
                    "success": True,
                    "message": message,
                    "response": result.get("answer", ""),
                    "sources": sources,
                    "rag_used": True
                })

        except Exception:
            # RAG failure should not prevent normal AI chat.
            pass

        # Fall back to normal Gemma chat.
        response = chat_service.chat(message)

        return jsonify({
            "success": True,
            "message": message,
            "response": response,
            "sources": [],
            "rag_used": False
        })

    except ValueError as error:
        return jsonify({
            "success": False,
            "error": str(error)
        }), 400

    except Exception as error:
        return jsonify({
            "success": False,
            "error": "Unable to process the chat request.",
            "details": str(error)
        }), 500