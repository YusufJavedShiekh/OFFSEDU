from flask import Blueprint, jsonify, request

from ai.quiz_service import quiz_service
from rag.rag_service import rag_service


quiz_bp = Blueprint(
    "quiz",
    __name__,
    url_prefix="/api/quiz"
)


@quiz_bp.route("/", methods=["POST"])
def generate_quiz():
    """Generate an AI-powered quiz."""

    data = request.get_json(silent=True) or {}

    topic = str(data.get("topic", "")).strip()
    document_id = data.get("document_id")
    num_questions = data.get("num_questions", 5)
    difficulty = str(data.get("difficulty", "Medium")).strip() or "Medium"
    language = str(data.get("language", "English")).strip() or "English"

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
                    document_id=document_id
                )

            if not context:
                return jsonify({
                    "success": False,
                    "error": (
                        "No processed study material was found "
                        "for this document."
                    )
                }), 400

        quiz = quiz_service.generate_quiz(
            topic=topic,
            num_questions=num_questions,
            context=context,
            difficulty=difficulty,
            language=language
        )

        return jsonify({
            "success": True,
            "topic": topic,
            "document_id": document_id,
            "num_questions": num_questions,
            "difficulty": difficulty,
            "language": language,
            "questions": quiz
        })

    except ValueError as error:
        return jsonify({
            "success": False,
            "error": str(error)
        }), 400

    except Exception as error:
        return jsonify({
            "success": False,
            "error": "Unable to generate quiz.",
            "details": str(error)
        }), 500