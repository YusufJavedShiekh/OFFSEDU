from ai.explanation_service import explanation_service
from rag.rag_service import rag_service


document_id = 62
topic = "ALL"
language = "English"
level = "Simple"


print("Loading document context...")

context = rag_service.get_document_chunks(
    document_id=document_id
)

print("Context chunks:", len(context))

prompt = explanation_service._build_prompt(
    topic=topic,
    context=context,
    language=language,
    level=level,
)

print("Prompt length:", len(prompt))
print("Sending actual OFFSEDU prompt to Gemma...")

try:
    stream = explanation_service.explain_stream(
        topic=topic,
        context=context,
        language=language,
        level=level,
    )

    count = 0

    for chunk in stream:
        if chunk:
            print(chunk, end="", flush=True)
            count += 1

    print("\n\nDONE")
    print("Chunks received:", count)

except Exception as error:
    print("\n\nERROR:")
    print(type(error).__name__)
    print(str(error))