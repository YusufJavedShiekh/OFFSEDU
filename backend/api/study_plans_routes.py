from flask import Blueprint, jsonify, request

from ai.study_plan_service import study_plan_service


study_plans_bp = Blueprint(
    "study_plans",
    __name__,
    url_prefix="/api/study-plans"
)


@study_plans_bp.route("/", methods=["POST"])
def create_study_plan():
    """Generate an AI-powered study plan."""

    data = request.get_json(silent=True) or {}

    topic = data.get("topic", "").strip()
    duration = data.get("duration")

    if not topic:
        return jsonify({
            "success": False,
            "error": "Topic is required"
        }), 400

    if duration is None or not str(duration).strip():
        return jsonify({
            "success": False,
            "error": "Duration is required"
        }), 400

    try:
        plan = study_plan_service.generate_plan(
            topic=topic,
            duration=duration
        )

        return jsonify({
            "success": True,
            "topic": topic,
            "duration": duration,
            "plan": plan
        })

    except ValueError as error:
        return jsonify({
            "success": False,
            "error": str(error)
        }), 400

    except Exception as error:
        return jsonify({
            "success": False,
            "error": "Unable to generate study plan.",
            "details": str(error)
        }), 500


@study_plans_bp.route("/", methods=["GET"])
def get_study_plans():
    """Return saved study plans."""

    return jsonify({
        "success": True,
        "study_plans": []
    })