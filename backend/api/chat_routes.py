from flask import Blueprint, jsonify, request

from ai.chat_service import chat_service
from database.database import SessionLocal
from database.repositories.chat_repository import (
    create_chat_session,
    get_chat_messages,
    get_chat_session,
    save_chat_message,
)

chat_bp = Blueprint(
    "chat",
    __name__,
    url_prefix="/api/chat",
)

RAG_DISTANCE_THRESHOLD = 0.65


def _has_relevant_sources(sources):
    """Return True when at least one retrieved chunk is sufficiently relevant."""
    if not sources:
        return False

    for source in sources:
        distance = source.get("distance")

        if distance is None:
            continue

        try:
            if float(distance) <= RAG_DISTANCE_THRESHOLD:
                return True
        except (TypeError, ValueError):
            continue

    return False


@chat_bp.route("/", methods=["POST"])
def chat():
    """Handle chat requests with SQL-backed conversation history."""

    data = request.get_json(silent=True) or {}

    message = data.get("message", "").strip()
    session_id = data.get("session_id")

    if not message:
        return jsonify({
            "success": False,
            "error": "Message is required",
        }), 400

    db = SessionLocal()

    try:
        # Create a new chat conversation when no session exists.
        if session_id is not None:
            try:
                session_id = int(session_id)
            except (TypeError, ValueError):
                return jsonify({
                    "success": False,
                    "error": "Invalid session_id",
                }), 400

            chat_session = get_chat_session(db, session_id)

            if not chat_session:
                return jsonify({
                    "success": False,
                    "error": "Chat session not found",
                }), 404

        else:
            chat_session = create_chat_session(
                db,
                title="New Chat",
                language="English",
            )

            session_id = chat_session.id

        # Load previous messages BEFORE saving the current message.
        previous_messages = get_chat_messages(
            db,
            session_id,
        )

        # Save current student message.
        save_chat_message(
            db=db,
            session_id=session_id,
            role="user",
            message=message,
            language="English",
        )

        # Try document/RAG context first.
        try:
            from rag.rag_service import rag_service

            result = rag_service.ask(
                question=message,
                top_k=5,
            )

            sources = result.get("sources", [])

            if _has_relevant_sources(sources):
                response = result.get("answer", "")

                save_chat_message(
                    db=db,
                    session_id=session_id,
                    role="assistant",
                    message=response,
                    language="English",
                )

                return jsonify({
                    "success": True,
                    "session_id": session_id,
                    "message": message,
                    "response": response,
                    "sources": sources,
                    "rag_used": True,
                })

        except Exception:
            pass

        # No sufficiently relevant RAG result:
        # use Gemma with previous SQL conversation history.
        response = chat_service.chat(
            message,
            history=previous_messages,
        )

        # Save Gemma response to SQL.
        save_chat_message(
            db=db,
            session_id=session_id,
            role="assistant",
            message=response,
            language="English",
        )

        return jsonify({
            "success": True,
            "session_id": session_id,
            "message": message,
            "response": response,
            "sources": [],
            "rag_used": False,
        })

    except ValueError as error:
        db.rollback()

        return jsonify({
            "success": False,
            "error": str(error),
        }), 400

    except Exception as error:
        db.rollback()

        return jsonify({
            "success": False,
            "error": "Unable to process the chat request.",
            "details": str(error),
        }), 500

    finally:
        db.close()