from flask import Blueprint, jsonify, request


test_paper_bp = Blueprint(
    "test_paper",
    __name__,
    url_prefix="/api/test-paper"
)


@test_paper_bp.route("/", methods=["POST"])
def generate_test_paper():
    data = request.get_json(silent=True) or {}

    topic = data.get("topic", "").strip()
    num_questions = data.get("num_questions", 10)

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

    if num_questions < 1 or num_questions > 100:
        return jsonify({
            "success": False,
            "error": "num_questions must be between 1 and 100"
        }), 400

    # AI test-paper generation will be connected later.
    return jsonify({
        "success": True,
        "topic": topic,
        "num_questions": num_questions,
        "questions": [],
        "message": "AI test-paper service is not connected yet."
    })
