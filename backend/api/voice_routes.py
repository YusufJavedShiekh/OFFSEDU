from pathlib import Path
from uuid import uuid4

from flask import Blueprint, jsonify, request

from config import UPLOADS_DIR
from voice.speech_to_text import get_stt_service


voice_bp = Blueprint(
    "voice",
    __name__,
    url_prefix="/api/voice"
)


@voice_bp.route("/status", methods=["GET"])
def voice_status():
    try:
        stt_service = get_stt_service()
        stt_available = stt_service.is_available()
    except Exception:
        stt_available = False

    return jsonify({
        "success": True,
        "service": "voice",
        "status": "available" if stt_available else "unavailable",
        "speech_to_text": stt_available,
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

    extension = Path(file.filename).suffix.lower()

    allowed_extensions = {
        ".wav",
        ".mp3",
        ".m4a",
        ".ogg",
        ".flac",
    }

    if extension not in allowed_extensions:
        return jsonify({
            "success": False,
            "error": "Unsupported audio format."
        }), 400

    stored_filename = f"{uuid4().hex}{extension}"
    audio_path = UPLOADS_DIR / stored_filename

    file.save(audio_path)

    try:
        stt_service = get_stt_service()

        result = stt_service.transcribe(
            audio_path=str(audio_path)
        )

        response = result.to_dict()

        return jsonify({
            "success": response.get("success", False),
            "text": response.get("text", ""),
            "language": response.get("language"),
            "confidence": response.get("confidence"),
            "duration": response.get("duration"),
            "chunks": response.get("chunks", 0),
            "error": response.get("error"),
            "metadata": response.get("metadata", {}),
        })

    except Exception as error:
        return jsonify({
            "success": False,
            "error": "Unable to transcribe audio.",
            "details": str(error)
        }), 500

    finally:
        try:
            if audio_path.exists():
                audio_path.unlink()
        except OSError:
            pass