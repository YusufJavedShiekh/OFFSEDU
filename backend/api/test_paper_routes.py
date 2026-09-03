from flask import Blueprint, jsonify, request

from ai.gemma_service import gemma_service
from ai.prompts import TEST_PAPER_PROMPT


test_paper_bp = Blueprint(
    "test_paper",
    __name__,
    url_prefix="/api/test-paper"
)


@test_paper_bp.route("/", methods=["POST"])
def generate_test_paper():
    """Generate an AI-powered practice test paper."""

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

    try:
        prompt = TEST_PAPER_PROMPT.format(
            topic=topic,
            num_questions=num_questions
        )

        test_paper = gemma_service.generate(prompt)

        return jsonify({
            "success": True,
            "topic": topic,
            "num_questions": num_questions,
            "test_paper": test_paper
        })

    except ValueError as error:
        return jsonify({
            "success": False,
            "error": str(error)
        }), 400

    except Exception as error:
        return jsonify({
            "success": False,
            "error": "Unable to generate test paper.",
            "details": str(error)
        }), 500