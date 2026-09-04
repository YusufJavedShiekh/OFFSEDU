# ============================================================
# OFFSEDU AI - Fast Conversation Router
# ============================================================

import re


class ConversationRouter:
    """Lightweight intent, language, and reference router."""

    REFERENCE_PATTERNS = (
        r"\bthis\b",
        r"\bthat\b",
        r"\bit\b",
        r"\bthese\b",
        r"\bthose\b",
        r"\babove\b",
        r"\bprevious\b",
        r"\bagain\b",
        r"\bmore\b",
        r"\banother\b",
        r"\bcontinue\b",
        r"\bsimpler\b",
    )

    def route(self, message, history=None):
        if not message or not message.strip():
            raise ValueError("Message cannot be empty.")

        text = message.strip()
        history = history or []

        return {
            "intent": self.detect_intent(text),
            "language": self.detect_language(text),
            "is_reference": self.is_reference_query(text, history),
            "rag_query": self.build_rag_query(text, history),
        }

    @staticmethod
    def detect_intent(message):
        text = message.lower()

        if any(x in text for x in ("quiz", "mcq", "multiple choice")):
            return "quiz"
        if any(x in text for x in ("test paper", "question paper", "exam paper")):
            return "test_paper"
        if any(x in text for x in ("study plan", "study schedule", "timetable")):
            return "study_plan"
        if any(x in text for x in ("summarize", "summary", "short notes", "notes")):
            return "summarize"
        if any(x in text for x in ("explain", "meaning", "what is", "how does")):
            return "explain"

        return "chat"

    @staticmethod
    def detect_language(message):
        if re.search(r"[\u0600-\u06FF]", message):
            return "Urdu"

        if re.search(r"[\u0900-\u097F]", message):
            return "Hindi/Marathi"

        lower = message.lower()
        words = set(re.findall(r"[a-zA-Z]+", lower))

        hindi_markers = {
            "kya", "kaise", "kyun", "kyon", "mujhe", "mera", "meri",
            "aap", "tum", "samjha", "samjhao", "batao", "hai", "hain",
        }

        if len(words.intersection(hindi_markers)) >= 2:
            return "Hinglish"

        return "English"

    def is_reference_query(self, message, history):
        if not history:
            return False

        text = message.lower()
        return any(re.search(pattern, text) for pattern in self.REFERENCE_PATTERNS)

    def build_rag_query(self, message, history):
        if not self.is_reference_query(message, history):
            return message.strip()

        recent = history[-4:]
        lines = []

        for item in recent:
            if isinstance(item, dict):
                role = item.get("role")
                content = item.get("message") or item.get("text")
            else:
                role = getattr(item, "role", None)
                content = getattr(item, "message", None)

            if role and content:
                lines.append(f"{role}: {content}")

        if not lines:
            return message.strip()

        return (
            "Resolve the reference in the current question using the recent conversation.\n\n"
            "RECENT CONVERSATION:\n"
            + "\n".join(lines)
            + "\n\nCURRENT QUESTION:\n"
            + message.strip()
        )


conversation_router = ConversationRouter()
