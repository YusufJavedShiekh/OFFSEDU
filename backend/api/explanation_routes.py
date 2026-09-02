from flask import Blueprint, jsonify, request


explanation_bp = Blueprint(
    "explanation",
    __name__,
    url_prefix="/api/explanation"
)


@explanation_bp.route("/", methods=["POST"])
def explain():
    data = request.get_json(silent=True) or {}

    topic = data.get("topic", "").strip()

    if not topic:
        return jsonify({
            "success": False,
            "error": "Topic is required"
        }), 400

    # AI explanation service will be connected later.
    return jsonify({
        "success": True,
        "topic": topic,
        "explanation": "AI explanation service is not connected yet."
    })
