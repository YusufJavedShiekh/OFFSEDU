from .chat_repository import (
    create_chat_session,
    get_chat_session,
    get_user_chat_sessions,
    save_chat_message,
    get_chat_messages,
    delete_chat_session,
)

from .document_repository import (
    create_document,
    get_document,
    get_user_documents,
    update_document_status,
    update_document_text,
    delete_document,
)

from .quiz_repository import (
    create_quiz,
    add_question,
    get_quiz,
    get_user_quizzes,
    get_quiz_questions,
    delete_quiz,
)

from .result_repository import (
    create_quiz_attempt,
    save_quiz_answer,
    complete_quiz_attempt,
    get_quiz_result,
    get_user_quiz_results,
)

from .study_repository import (
    create_study_plan,
    get_study_plan,
    get_user_study_plans,
    update_study_plan,
    delete_study_plan,
)


__all__ = [
    # Chat
    "create_chat_session",
    "get_chat_session",
    "get_user_chat_sessions",
    "save_chat_message",
    "get_chat_messages",
    "delete_chat_session",

    # Documents
    "create_document",
    "get_document",
    "get_user_documents",
    "update_document_status",
    "update_document_text",
    "delete_document",

    # Quiz
    "create_quiz",
    "add_question",
    "get_quiz",
    "get_user_quizzes",
    "get_quiz_questions",
    "delete_quiz",

    # Results
    "create_quiz_attempt",
    "save_quiz_answer",
    "complete_quiz_attempt",
    "get_quiz_result",
    "get_user_quiz_results",

    # Study plans
    "create_study_plan",
    "get_study_plan",
    "get_user_study_plans",
    "update_study_plan",
    "delete_study_plan",
]
