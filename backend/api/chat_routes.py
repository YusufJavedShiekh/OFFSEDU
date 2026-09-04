
import base64

from flask import Blueprint, jsonify, request

from ai.chat_service import chat_service
from ai.conversation_router import conversation_router

from database.database import SessionLocal
from database.repositories.chat_repository import (
    create_chat_session,
    delete_chat_session,
    get_chat_messages,
    get_chat_session,
    get_user_chat_sessions,
    save_chat_message,
)


chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")

RAG_DISTANCE_THRESHOLD = 0.65


def _has_relevant_sources(sources):
    for source in sources or []:
        distance = source.get("distance")

        if distance is None:
            continue

        try:
            if float(distance) <= RAG_DISTANCE_THRESHOLD:
                return True
        except (TypeError, ValueError):
            continue

    return False


def _serialize_session(chat_session):
    return {
        "id": chat_session.id,
        "title": chat_session.title,
        "language": chat_session.language,
        "created_at": (
            chat_session.created_at.isoformat()
            if chat_session.created_at
            else None
        ),
        "updated_at": (
            chat_session.updated_at.isoformat()
            if chat_session.updated_at
            else None
        ),
    }


@chat_bp.route("/", methods=["GET"])
def list_chat_sessions():
    db = SessionLocal()

    try:
        sessions = get_user_chat_sessions(db, user_id=None)

        return jsonify({
            "success": True,
            "sessions": [
                _serialize_session(session)
                for session in sessions
            ],
        })

    except Exception as error:
        return jsonify({
            "success": False,
            "error": "Unable to load chat history.",
            "details": str(error),
        }), 500

    finally:
        db.close()


@chat_bp.route("/", methods=["POST"])
def chat():
    # Supports both:
    # - application/json for text-only requests
    # - multipart/form-data for requests containing images
    if request.content_type and request.content_type.startswith(
        "multipart/form-data"
    ):
        message = request.form.get("message", "").strip()
        session_id = request.form.get("session_id")
        document_id = request.form.get("document_id")
        language = request.form.get("language") or "English"
        uploaded_file = request.files.get("file")
    else:
        data = request.get_json(silent=True) or {}

        message = data.get("message", "").strip()
        session_id = data.get("session_id")
        document_id = data.get("document_id")
        language = data.get("language") or "English"
        uploaded_file = None

    if not message:
        return jsonify({
            "success": False,
            "error": "Message is required",
        }), 400

    # Convert the uploaded image to base64 for Ollama vision.
    image_base64 = None

    if uploaded_file:
        content_type = uploaded_file.content_type or ""

        if content_type.startswith("image/"):
            image_bytes = uploaded_file.read()

            if image_bytes:
                image_base64 = base64.b64encode(
                    image_bytes
                ).decode("utf-8")

        else:
            return jsonify({
                "success": False,
                "error": "Only image files are supported for AI vision.",
            }), 400

    db = SessionLocal()

    try:
        # Resolve existing chat session.
        if session_id is not None:
            try:
                session_id = int(session_id)
            except (TypeError, ValueError):
                return jsonify({
                    "success": False,
                    "error": "Invalid session_id",
                }), 400

            chat_session = get_chat_session(
                db,
                session_id,
            )

            if not chat_session:
                return jsonify({
                    "success": False,
                    "error": "Chat session not found",
                }), 404

        # Create a new SQL chat session.
        else:
            chat_session = create_chat_session(
                db,
                title=message[:60],
                language=language,
            )

            session_id = chat_session.id

        # Load previous SQL chat messages before saving the new message.
        previous_messages = get_chat_messages(
            db,
            session_id,
        )

        # Route the conversation.
        route = conversation_router.route(
            message,
            history=previous_messages,
        )

        detected_language = route["language"]

        if language == "English" and detected_language != "English":
            language = detected_language

        # Save the user's message in SQL.
        save_chat_message(
            db=db,
            session_id=session_id,
            role="user",
            message=message,
            language=language,
        )

        # ---------------------------------------------------------
        # IMAGE / VISION MODE
        # ---------------------------------------------------------
        #
        # When an image is attached, send it directly to Gemma.
        # RAG remains available for normal document-grounded chats.
        #
        if image_base64:
            response = chat_service.chat(
                message,
                history=previous_messages,
                language=language,
                intent=route["intent"],
                image=image_base64,
            )

            save_chat_message(
                db=db,
                session_id=session_id,
                role="assistant",
                message=response,
                language=language,
            )

            return jsonify({
                "success": True,
                "session_id": session_id,
                "message": message,
                "response": response,
                "sources": [],
                "rag_used": False,
                "vision_used": True,
                "language": language,
                "intent": route["intent"],
            })

        # ---------------------------------------------------------
        # DOCUMENT-GROUNDED MODE
        # ---------------------------------------------------------
        #
        # Conversation references are resolved before retrieval.
        #
        if document_id:
            try:
                from rag.rag_service import rag_service

                result = rag_service.ask(
                    question=route["rag_query"],
                    top_k=5,
                    document_id=document_id,
                    language=language,
                    conversation_context=(
                        route["rag_query"]
                        if route["is_reference"]
                        else ""
                    ),
                )

                sources = result.get("sources", [])

                if _has_relevant_sources(sources):
                    response = result.get("answer", "")

                    save_chat_message(
                        db=db,
                        session_id=session_id,
                        role="assistant",
                        message=response,
                        language=language,
                    )

                    return jsonify({
                        "success": True,
                        "session_id": session_id,
                        "message": message,
                        "response": response,
                        "sources": sources,
                        "rag_used": True,
                        "vision_used": False,
                        "language": language,
                        "intent": route["intent"],
                    })

            except Exception:
                # If RAG fails, continue with normal Gemma chat.
                pass

        # ---------------------------------------------------------
        # NORMAL CONVERSATIONAL MODE
        # ---------------------------------------------------------
        response = chat_service.chat(
            message,
            history=previous_messages,
            language=language,
            intent=route["intent"],
        )

        # Save assistant response in SQL.
        save_chat_message(
            db=db,
            session_id=session_id,
            role="assistant",
            message=response,
            language=language,
        )

        return jsonify({
            "success": True,
            "session_id": session_id,
            "message": message,
            "response": response,
            "sources": [],
            "rag_used": False,
            "vision_used": False,
            "language": language,
            "intent": route["intent"],
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


@chat_bp.route("/<int:session_id>", methods=["GET"])
def get_chat_history(session_id):
    db = SessionLocal()

    try:
        chat_session = get_chat_session(
            db,
            session_id,
        )

        if not chat_session:
            return jsonify({
                "success": False,
                "error": "Chat session not found",
            }), 404

        messages = get_chat_messages(
            db,
            session_id,
        )

        return jsonify({
            "success": True,
            "session_id": session_id,
            "messages": [
                {
                    "id": message.id,
                    "role": message.role,
                    "message": message.message,
                    "language": message.language,
                    "created_at": (
                        message.created_at.isoformat()
                        if message.created_at
                        else None
                    ),
                }
                for message in messages
            ],
        })

    except Exception as error:
        return jsonify({
            "success": False,
            "error": "Unable to load chat history.",
            "details": str(error),
        }), 500

    finally:
        db.close()


@chat_bp.route("/<int:session_id>", methods=["DELETE"])
def remove_chat_session(session_id):
    db = SessionLocal()

    try:
        if not get_chat_session(
            db,
            session_id,
        ):
            return jsonify({
                "success": False,
                "error": "Chat session not found",
            }), 404

        delete_chat_session(
            db,
            session_id,
        )

        return jsonify({
            "success": True,
            "session_id": session_id,
        })

    except Exception as error:
        db.rollback()

        return jsonify({
            "success": False,
            "error": "Unable to delete chat session.",
            "details": str(error),
        }), 500

    finally:
        db.close()