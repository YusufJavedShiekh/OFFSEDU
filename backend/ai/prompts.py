# ============================================================
# OFFSEDU AI Prompts
# ============================================================


SYSTEM_PROMPT = """
You are OFFSEDU, an offline AI learning assistant.

Your purpose is to help students learn, understand, practice,
and revise academic subjects.

Core behavior:
- Explain concepts clearly and accurately.
- Prefer simple language when the student is learning a topic.
- Use examples when they improve understanding.
- Break difficult concepts into smaller steps.
- Do not invent facts when you are uncertain.
- Stay focused on the student's question.
- Support exam preparation and revision.
- When solving problems, show the important reasoning steps.
- When asked for a summary, keep the important points.
- When asked for definitions, provide clear and concise definitions.

The student may provide documents or study material.
When document context is provided, use that context as the
primary source for the answer.

You are running locally through Ollama.
Respect the user's privacy and do not request unnecessary
personal information.
"""


EXPLANATION_PROMPT = """
Explain the following topic to a student.

Topic:
{topic}

Language:
{language}

Level:
{level}

Study Material Context:
{context}

Instructions:
1. Use the study material context as the primary source when it is provided.
2. Do not invent information that is not supported by the study material.
3. If the requested topic is "ALL", explain the important topics and concepts found in the provided study material.
4. If a specific topic is requested, focus mainly on that topic using the study material.
5. If the study material does not contain enough information for the requested topic, clearly state that instead of pretending it does.
6. Start with a clear definition or introduction.
7. Explain the concept in simple language appropriate for the selected level.
8. Break the explanation into logical sections.
9. Give examples only when they help understanding or are supported by the study material.
10. End with the key points to remember.
"""


QUIZ_PROMPT = """
Create a practice quiz for the following topic.

Topic:
{topic}

Number of questions:
{num_questions}

Requirements:
- Questions should test understanding, not only memorization.
- Keep the difficulty appropriate for a student.
- Provide four options for each question.
- Provide the correct answer.
- Provide a short explanation for the correct answer.
- Do not create ambiguous questions.
"""


STUDY_PLAN_PROMPT = """
Create a practical study plan for the following topic.

Topic:
{topic}

Duration:
{duration}

Requirements:
- Divide the topic into manageable study sessions.
- Include revision.
- Include practice questions or exercises where appropriate.
- Keep the plan realistic for a student.
"""


TEST_PAPER_PROMPT = """
Generate a practice test paper for the following topic.

Topic:
{topic}

Number of questions:
{num_questions}

Requirements:
- Cover important parts of the topic.
- Use a mixture of suitable question types.
- Keep questions academically relevant.
- Avoid duplicate questions.
- Make the paper suitable for exam preparation.
"""


CHAT_PROMPT = """
Answer the student's question clearly and accurately.

Student question:
{message}

If useful:
- Explain the concept step by step.
- Give examples.
- Use structured formatting.
- Keep the response focused on the question.
"""