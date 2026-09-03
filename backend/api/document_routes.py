from pathlib import Path
from uuid import uuid4

from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename

from config import UPLOADS_DIR


document_bp = Blueprint(
    "documents",
    __name__,
    url_prefix="/api/documents"
)


ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".pptx",
    ".txt",
    ".md",
}


@document_bp.route("/", methods=["GET"])
def list_documents():
    """List uploaded documents."""

    documents = []

    for file_path in UPLOADS_DIR.iterdir():
        if file_path.is_file():
            documents.append({
                "filename": file_path.name,
                "size": file_path.stat().st_size,
            })

    return jsonify({
        "success": True,
        "documents": documents,
    })


@document_bp.route("/upload", methods=["POST"])
def upload_document():
    """Upload a document for processing."""

    if "file" not in request.files:
        return jsonify({
            "success": False,
            "error": "No file provided",
        }), 400

    file = request.files["file"]

    if not file.filename:
        return jsonify({
            "success": False,
            "error": "Filename is required",
        }), 400

    original_filename = file.filename
    safe_filename = secure_filename(original_filename)

    if not safe_filename:
        return jsonify({
            "success": False,
            "error": "Invalid filename",
        }), 400

    extension = Path(safe_filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        return jsonify({
            "success": False,
            "error": (
                "Unsupported file type. "
                "Supported types: PDF, DOCX, PPTX, TXT, MD."
            ),
        }), 400

    unique_filename = (
        f"{uuid4().hex}_{safe_filename}"
    )

    file_path = UPLOADS_DIR / unique_filename

    file.save(file_path)

    return jsonify({
        "success": True,
        "filename": original_filename,
        "stored_filename": unique_filename,
        "file_type": extension,
        "path": str(file_path),
        "message": "Document uploaded successfully.",
    })