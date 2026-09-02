from flask import Blueprint, jsonify, request


document_bp = Blueprint(
    "documents",
    __name__,
    url_prefix="/api/documents"
)


@document_bp.route("/", methods=["GET"])
def list_documents():
    return jsonify({
        "success": True,
        "documents": []
    })


@document_bp.route("/upload", methods=["POST"])
def upload_document():
    if "file" not in request.files:
        return jsonify({
            "success": False,
            "error": "No file provided"
        }), 400

    file = request.files["file"]

    if not file.filename:
        return jsonify({
            "success": False,
            "error": "Filename is required"
        }), 400

    # Actual document processing will be connected later.
    return jsonify({
        "success": True,
        "filename": file.filename,
        "message": "Document received. Processing service is not connected yet."
    })
