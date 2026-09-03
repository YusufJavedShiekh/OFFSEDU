from flask import Blueprint, jsonify, request

from ai.explanation_service import explanation_service


explanation_bp = Blueprint(
    "explanation",
    __name__,
    url_prefix="/api/explanation"
)


@explanation_bp.route("/", methods=["POST"])
def explain():
    """Generate an AI explanation for a topic."""

    data = request.get_json(silent=True) or {}

    topic = data.get("topic", "").strip()

    if not topic:
        return jsonify({
            "success": False,
            "error": "Topic is required"
        }), 400

    try:
        explanation = explanation_service.explain(topic)

        return jsonify({
            "success": True,
            "topic": topic,
            "explanation": explanation
        })

    except ValueError as error:
        return jsonify({
            "success": False,
            "error": str(error)
        }), 400

    except Exception as error:
        return jsonify({
            "success": False,
            "error": "Unable to generate explanation.",
            "details": str(error)
        }), 500