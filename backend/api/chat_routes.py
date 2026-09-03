from flask import Blueprint, jsonify, request

from ai.chat_service import chat_service


chat_bp = Blueprint(
    "chat",
    __name__,
    url_prefix="/api/chat"
)


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
        # ----------------------------------------------------
        # Try RAG first
        # ----------------------------------------------------

        try:
            from rag.rag_service import rag_service

            result = rag_service.ask(
                question=message,
                top_k=5
            )

            if result.get("sources"):
                return jsonify({
                    "success": True,
                    "message": message,
                    "response": result.get("answer", ""),
                    "sources": result.get("sources", []),
                    "rag_used": True
                })

        except Exception:
            # RAG may not be available until its dependencies
            # and document knowledge base are configured.
            pass

        # ----------------------------------------------------
        # Normal AI chat fallback
        # ----------------------------------------------------

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