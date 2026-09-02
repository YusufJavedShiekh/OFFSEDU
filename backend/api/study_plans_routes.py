from flask import Blueprint, jsonify, request


study_plans_bp = Blueprint(
    "study_plans",
    __name__,
    url_prefix="/api/study-plans"
)


@study_plans_bp.route("/", methods=["POST"])
def create_study_plan():
    data = request.get_json(silent=True) or {}

    topic = data.get("topic", "").strip()
    duration = data.get("duration")

    if not topic:
        return jsonify({
            "success": False,
            "error": "Topic is required"
        }), 400

    # AI study-plan service will be connected later.
    return jsonify({
        "success": True,
        "topic": topic,
        "duration": duration,
        "plan": [],
        "message": "AI study plan service is not connected yet."
    })


@study_plans_bp.route("/", methods=["GET"])
def get_study_plans():
    return jsonify({
        "success": True,
        "study_plans": []
    })
