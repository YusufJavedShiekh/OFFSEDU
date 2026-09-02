from sqlalchemy.orm import Session

from database.models import Document


# =========================================================
# CREATE DOCUMENT
# =========================================================

def create_document(
    db: Session,
    user_id: int | None,
    original_filename: str,
    stored_filename: str,
    file_path: str,
    file_type: str,
    file_size: int | None = None,
    language: str = "English",
):
    document = Document(
        user_id=user_id,
        original_filename=original_filename,
        stored_filename=stored_filename,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
        language=language,
        status="uploaded",
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document


# =========================================================
# GET DOCUMENT
# =========================================================

def get_document(
    db: Session,
    document_id: int,
):
    return (
        db.query(Document)
        .filter(
            Document.id == document_id
        )
        .first()
    )


# =========================================================
# GET USER DOCUMENTS
# =========================================================

def get_user_documents(
    db: Session,
    user_id: int,
):
    return (
        db.query(Document)
        .filter(
            Document.user_id == user_id
        )
        .order_by(
            Document.created_at.desc()
        )
        .all()
    )


# =========================================================
# UPDATE DOCUMENT STATUS
# =========================================================

def update_document_status(
    db: Session,
    document_id: int,
    status: str,
):
    document = get_document(
        db,
        document_id
    )

    if not document:
        return None

    document.status = status

    db.commit()
    db.refresh(document)

    return document


# =========================================================
# SAVE EXTRACTED TEXT
# =========================================================

def update_document_text(
    db: Session,
    document_id: int,
    extracted_text: str,
):
    document = get_document(
        db,
        document_id
    )

    if not document:
        return None

    document.extracted_text = extracted_text
    document.status = "processed"

    db.commit()
    db.refresh(document)

    return document


# =========================================================
# DELETE DOCUMENT
# =========================================================

def delete_document(
    db: Session,
    document_id: int,
):
    document = get_document(
        db,
        document_id
    )

    if not document:
        return False

    db.delete(document)
    db.commit()

    return True
