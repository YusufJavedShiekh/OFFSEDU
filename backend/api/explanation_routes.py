from flask import Blueprint, jsonify, request

from ai.explanation_service import explanation_service
from rag.rag_service import rag_service


explanation_bp = Blueprint(
    "explanation",
    __name__,
    url_prefix="/api/explanation",
)


@explanation_bp.route("/", methods=["POST"])
def explain():
    """Generate an AI explanation using optional document context."""

    data = request.get_json(silent=True) or {}

    topic = str(data.get("topic", "")).strip()
    document_id = data.get("document_id")

    language = str(
        data.get("language", "English")
    ).strip() or "English"

    level = str(
        data.get("level", "Simple")
    ).strip() or "Simple"

    if not topic:
        return jsonify({
            "success": False,
            "error": "Topic is required",
        }), 400

    try:
        context = []

        if document_id:
            if topic.upper() == "ALL":
                context = rag_service.get_document_chunks(
                    document_id=document_id
                )
            else:
                context = rag_service.search(
                    query=topic,
                    top_k=8,
                    document_id=document_id,
                )

            if not context:
                return jsonify({
                    "success": False,
                    "error": (
                        "No processed study material was found "
                        "for this document."
                    ),
                }), 400

        explanation = explanation_service.explain(
            topic=topic,
            context=context,
            language=language,
            level=level,
        )

        return jsonify({
            "success": True,
            "topic": topic,
            "document_id": document_id,
            "language": language,
            "level": level,
            "explanation": explanation,
            "sources": context,
        })

    except ValueError as error:
        return jsonify({
            "success": False,
            "error": str(error),
        }), 400

    except Exception as error:
        return jsonify({
            "success": False,
            "error": "Unable to generate explanation.",
            "details": str(error),
        }), 500