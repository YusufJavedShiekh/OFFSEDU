from flask import Blueprint, jsonify, request


voice_bp = Blueprint(
    "voice",
    __name__,
    url_prefix="/api/voice"
)


@voice_bp.route("/status", methods=["GET"])
def voice_status():
    return jsonify({
        "success": True,
        "service": "voice",
        "status": "not_connected"
    })


@voice_bp.route("/transcribe", methods=["POST"])
def transcribe():
    if "file" not in request.files:
        return jsonify({
            "success": False,
            "error": "No audio file provided"
        }), 400

    file = request.files["file"]

    if not file.filename:
        return jsonify({
            "success": False,
            "error": "Filename is required"
        }), 400

    # Speech-to-text service will be connected later.
    return jsonify({
        "success": True,
        "filename": file.filename,
        "text": "",
        "message": "Speech-to-text service is not connected yet."
    })
