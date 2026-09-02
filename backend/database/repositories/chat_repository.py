from datetime import datetime

from sqlalchemy.orm import Session

from database.models import (
    ChatSession,
    ChatMessage,
)


# =========================================================
# CREATE CHAT SESSION
# =========================================================

def create_chat_session(
    db: Session,
    user_id: int | None = None,
    title: str = "New Chat",
    language: str = "English",
):
    chat = ChatSession(
        user_id=user_id,
        title=title,
        language=language,
    )

    db.add(chat)
    db.commit()
    db.refresh(chat)

    return chat


# =========================================================
# GET CHAT SESSION
# =========================================================

def get_chat_session(
    db: Session,
    session_id: int,
):
    return (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session_id
        )
        .first()
    )


# =========================================================
# GET USER CHAT SESSIONS
# =========================================================

def get_user_chat_sessions(
    db: Session,
    user_id: int,
):
    return (
        db.query(ChatSession)
        .filter(
            ChatSession.user_id == user_id
        )
        .order_by(
            ChatSession.updated_at.desc()
        )
        .all()
    )


# =========================================================
# SAVE CHAT MESSAGE
# =========================================================

def save_chat_message(
    db: Session,
    session_id: int,
    role: str,
    message: str,
    language: str = "English",
):
    chat_message = ChatMessage(
        session_id=session_id,
        role=role,
        message=message,
        language=language,
    )

    db.add(chat_message)

    session = get_chat_session(
        db,
        session_id
    )

    if session:
        session.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(chat_message)

    return chat_message


# =========================================================
# GET CHAT MESSAGES
# =========================================================

def get_chat_messages(
    db: Session,
    session_id: int,
):
    return (
        db.query(ChatMessage)
        .filter(
            ChatMessage.session_id == session_id
        )
        .order_by(
            ChatMessage.created_at.asc()
        )
        .all()
    )


# =========================================================
# DELETE CHAT SESSION
# =========================================================

def delete_chat_session(
    db: Session,
    session_id: int,
):
    chat = get_chat_session(
        db,
        session_id
    )

    if not chat:
        return False

    db.delete(chat)
    db.commit()

    return True
