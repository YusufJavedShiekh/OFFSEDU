from flask import Blueprint, jsonify, request


quiz_bp = Blueprint(
    "quiz",
    __name__,
    url_prefix="/api/quiz"
)


@quiz_bp.route("/", methods=["POST"])
def generate_quiz():
    data = request.get_json(silent=True) or {}

    topic = data.get("topic", "").strip()
    num_questions = data.get("num_questions", 5)

    if not topic:
        return jsonify({
            "success": False,
            "error": "Topic is required"
        }), 400

    try:
        num_questions = int(num_questions)
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "error": "num_questions must be a number"
        }), 400

    if num_questions < 1 or num_questions > 50:
        return jsonify({
            "success": False,
            "error": "num_questions must be between 1 and 50"
        }), 400

    # AI quiz generation will be connected later.
    return jsonify({
        "success": True,
        "topic": topic,
        "num_questions": num_questions,
        "questions": [],
        "message": "AI quiz service is not connected yet."
    })
