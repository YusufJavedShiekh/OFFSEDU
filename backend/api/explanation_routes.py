import json
import traceback

from flask import (
    Blueprint,
    Response,
    jsonify,
    request,
    stream_with_context,
)

from ai.explanation_service import explanation_service
from rag.rag_service import rag_service


explanation_bp = Blueprint(
    "explanation",
    __name__,
    url_prefix="/api/explanation",
)


def _get_explanation_data():
    """Read and validate explanation request data."""

    data = request.get_json(silent=True) or {}

    topic = str(data.get("topic", "")).strip()

    document_id = data.get("document_id")

    language = (
        str(data.get("language", "English")).strip()
        or "English"
    )

    level = (
        str(data.get("level", "Simple")).strip()
        or "Simple"
    )

    if not topic:
        raise ValueError("Topic is required")

    return topic, document_id, language, level


def _get_context(topic, document_id):
    """Retrieve document context when a document is selected."""

    context = []

    if document_id:
        if topic.upper() == "ALL":
            context = rag_service.get_document_chunks(
                document_id=document_id
            )
        else:
            context = rag_service.search(
                query=topic,
                top_k=8,
                document_id=document_id,
            )

        if not context:
            raise ValueError(
                "No processed study material was found "
                "for this document."
            )

    return context


@explanation_bp.route("/", methods=["POST"])
def explain():
    """Generate a complete AI explanation."""

    try:
        topic, document_id, language, level = (
            _get_explanation_data()
        )

        context = _get_context(
            topic,
            document_id,
        )

        explanation = explanation_service.explain(
            topic=topic,
            context=context,
            language=language,
            level=level,
        )

        return jsonify({
            "success": True,
            "topic": topic,
            "document_id": document_id,
            "language": language,
            "level": level,
            "explanation": explanation,
            "sources": context,
        })

    except ValueError as error:
        return jsonify({
            "success": False,
            "error": str(error),
        }), 400

    except Exception as error:
        traceback.print_exc()

        return jsonify({
            "success": False,
            "error": "Unable to generate explanation.",
            "details": str(error),
        }), 500


@explanation_bp.route(
    "/stream",
    methods=["POST", "OPTIONS"],
)
def explain_stream():
    """Generate an AI explanation as a streaming response."""

    # ---------------------------------------------------------
    # CORS preflight
    # ---------------------------------------------------------

    if request.method == "OPTIONS":
        response = Response(status=204)

        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = (
            "POST, OPTIONS"
        )
        response.headers["Access-Control-Allow-Headers"] = (
            "Content-Type"
        )

        return response

    # ---------------------------------------------------------
    # STEP 1: Read request
    # ---------------------------------------------------------

    try:
        topic, document_id, language, level = (
            _get_explanation_data()
        )

        print("\n========== REQUEST VALUES ==========")
        print("TOPIC  =", repr(topic))
        print("DOC ID =", repr(document_id))
        print("LANG   =", repr(language))
        print("LEVEL  =", repr(level))
        print("====================================\n")

    except ValueError as error:
        return jsonify({
            "success": False,
            "error": str(error),
        }), 400

    except Exception as error:
        traceback.print_exc()

        return jsonify({
            "success": False,
            "error": str(error),
            "details": traceback.format_exc(),
        }), 500

    # ---------------------------------------------------------
    # STEP 2: Retrieve context
    # ---------------------------------------------------------

    try:
        context = _get_context(
            topic,
            document_id,
        )

        print("\n========== STEP 2: CONTEXT ==========")
        print("Context count:", len(context))

        if context:
            for i, item in enumerate(context[:3]):
                print(f"\n--- Chunk {i + 1} ---")
                print(
                    item.get("document", "")[:500]
                )
        else:
            print("NO CONTEXT FOUND")

        print("=====================================\n")

    except ValueError as error:
        return jsonify({
            "success": False,
            "error": str(error),
        }), 400

    except Exception as error:
        traceback.print_exc()

        return jsonify({
            "success": False,
            "error": str(error),
            "details": traceback.format_exc(),
        }), 500

    # ---------------------------------------------------------
    # STEP 3: Build prompt
    # ---------------------------------------------------------

    try:
        prompt = explanation_service._build_prompt(
            topic=topic,
            context=context,
            language=language,
            level=level,
        )

        print("\n========== STEP 3: PROMPT ==========")
        print("Prompt length:", len(prompt))

        print(
            "Study Material Context present:",
            "Study Material Context:" in prompt,
        )

        print(
            "Vastu text present:",
            "Vastu" in prompt,
        )

        print("\nPrompt preview:")
        print(prompt[:3000])

        print("\n=====================================\n")

    except Exception as error:
        traceback.print_exc()

        return jsonify({
            "success": False,
            "error": "Unable to build explanation prompt.",
            "details": str(error),
        }), 500

    # ---------------------------------------------------------
    # STEP 4: Gemma streaming generator
    # ---------------------------------------------------------

    @stream_with_context
    def generate():
        try:
            print("\n========== STEP 4: GEMMA ==========")
            print("Starting Gemma stream...")

            stream = explanation_service.explain_stream(
                topic=topic,
                context=context,
                language=language,
                level=level,
            )

            print("Gemma stream created successfully.")

            for chunk in stream:
                if not chunk:
                    continue

                yield (
                    json.dumps(
                        {
                            "chunk": chunk,
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )

            yield (
                json.dumps(
                    {
                        "done": True,
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )

            print(
                "========== GEMMA COMPLETE ==========\n"
            )

        except Exception as error:
            traceback.print_exc()

            yield (
                json.dumps(
                    {
                        "error": str(error),
                        "done": True,
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )

    # ---------------------------------------------------------
    # STEP 5: Streaming response
    # ---------------------------------------------------------

    response = Response(
        generate(),
        mimetype="application/x-ndjson",
    )

    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = (
        "POST, OPTIONS"
    )
    response.headers["Access-Control-Allow-Headers"] = (
        "Content-Type"
    )

    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"

    return response