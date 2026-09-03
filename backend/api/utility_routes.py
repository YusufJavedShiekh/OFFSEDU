from flask import Blueprint, jsonify


utility_bp = Blueprint(
    "utility",
    __name__,
    url_prefix="/api/utility"
)


@utility_bp.route("/health", methods=["GET"])
def utility_health():
    return jsonify({
        "success": True,
        "service": "utility",
        "status": "available"
    })