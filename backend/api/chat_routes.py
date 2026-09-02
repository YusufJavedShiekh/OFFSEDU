from flask import Blueprint, jsonify, request


chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")


@chat_bp.route("/", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}

    message = data.get("message", "").strip()

    if not message:
        return jsonify({
            "success": False,
            "error": "Message is required"
        }), 400

    # AI response will be connected later.
    return jsonify({
        "success": True,
        "message": message,
        "response": "AI chat service is not connected yet."
    })
