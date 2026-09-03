from pathlib import Path
from uuid import uuid4

from flask import Blueprint, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename

from config import UPLOADS_DIR
from database.database import SessionLocal
from database.models import Document
from documents.docx_processor import DOCXProcessor
from documents.pdf_processor import PDFProcessor
from documents.pptx_processor import PPTXProcessor
from documents.text_processor import TextProcessor
from rag.rag_service import rag_service


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


PROCESSORS = {
    ".pdf": PDFProcessor,
    ".docx": DOCXProcessor,
    ".pptx": PPTXProcessor,
    ".txt": TextProcessor,
    ".md": TextProcessor,
}


def _extract_text(processed):
    """Get the main text from the supported processor result."""

    text = processed.get("text")

    if not text:
        text = processed.get("full_text")

    if not text:
        rag_ready = processed.get("rag_ready") or {}
        text = rag_ready.get("text")

    return (text or "").strip()


def _process_file(file_path, extension):
    """Run the existing processor for the uploaded file type."""

    processor_class = PROCESSORS.get(extension)

    if processor_class is None:
        raise ValueError(
            f"No document processor is configured for {extension}."
        )

    processor = processor_class()
    return processor.process(file_path)


@document_bp.route("/", methods=["GET"])
def list_documents():
    """List uploaded documents from the database."""

    db = SessionLocal()

    try:
        documents = (
            db.query(Document)
            .order_by(Document.created_at.desc())
            .all()
        )

        return jsonify({
            "success": True,
            "documents": [
                {
                    "document_id": document.id,
                    "filename": document.original_filename,
                    "original_filename": document.original_filename,
                    "stored_filename": document.stored_filename,
                    "file_type": document.file_type,
                    "file_size": document.file_size,
                    "status": document.status,
                    "created_at": (
                        document.created_at.isoformat()
                        if document.created_at
                        else None
                    ),
                }
                for document in documents
            ],
        })

    finally:
        db.close()


@document_bp.route("/upload", methods=["POST"])
def upload_document():
    """Upload, process, store, and index a document."""

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

    db = None
    document = None

    try:
        # 1. Save uploaded file
        file.save(file_path)

        file_size = file_path.stat().st_size

        # 2. Create database record
        db = SessionLocal()

        document = Document(
            original_filename=original_filename,
            stored_filename=unique_filename,
            file_path=str(file_path),
            file_type=extension,
            file_size=file_size,
            status="processing",
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        # 3. Process document using existing processor
        processed = _process_file(
            file_path=file_path,
            extension=extension,
        )

        if not processed.get("success"):
            document.status = "failed"
            db.commit()

            return jsonify({
                "success": False,
                "document_id": document.id,
                "filename": original_filename,
                "error": processed.get(
                    "error",
                    "Document processing failed.",
                ),
            }), 422

        # 4. Extract text
        extracted_text = _extract_text(processed)

        if not extracted_text:
            document.status = "failed"
            db.commit()

            return jsonify({
                "success": False,
                "document_id": document.id,
                "filename": original_filename,
                "error": "No text could be extracted from the document.",
            }), 422

        # 5. Index extracted text into RAG / Chroma
        rag_metadata = {
            "document_id": str(document.id),
            "original_filename": original_filename,
            "stored_filename": unique_filename,
            "file_type": extension,
        }

        chunk_ids = rag_service.index_document(
            text=extracted_text,
            metadata=rag_metadata,
        )

        # 6. Update database record
        document.extracted_text = extracted_text
        document.status = "processed"

        db.commit()

        # 7. Return complete result
        return jsonify({
            "success": True,
            "document_id": document.id,
            "filename": original_filename,
            "stored_filename": unique_filename,
            "file_type": extension,
            "file_size": file_size,
            "path": str(file_path),
            "text_length": len(extracted_text),
            "chunks_indexed": len(chunk_ids),
            "message": (
                "Document uploaded, processed, and "
                "indexed successfully."
            ),
        })

    except Exception as error:
        try:
            if db is not None and document is not None:
                document.status = "failed"
                db.commit()
        except Exception:
            if db is not None:
                db.rollback()

        return jsonify({
            "success": False,
            "error": str(error),
        }), 500

    finally:
        if db is not None:
            db.close()

@document_bp.route("/file/<path:filename>", methods=["GET"])
def serve_document(filename):
    """Serve an uploaded document for preview/download."""

    return send_from_directory(
        UPLOADS_DIR,
        filename,
        as_attachment=False,
    )