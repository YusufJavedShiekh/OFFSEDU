import { useState } from "react";
import {
  Award,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  RotateCcw,
  Sparkles,
  Upload,
  X,
  Zap,
  XCircle,
} from "lucide-react";

const difficulties = ["Easy", "Medium", "Hard"];
const questionCounts = [5, 10, 20, 30];
const languages = ["English", "Hindi", "Marathi", "Urdu"];

const sampleQuestions = [
  {
    question: "What is the main purpose of a DBMS?",
    options: [
      "To create computer hardware",
      "To manage and organize data",
      "To design websites",
      "To edit images",
    ],
    answer: 1,
    explanation:
      "A DBMS is used to store, organize, retrieve and manage data efficiently.",
  },
  {
    question: "Which of the following is a database language?",
    options: ["HTML", "CSS", "SQL", "XML"],
    answer: 2,
    explanation:
      "SQL stands for Structured Query Language and is widely used to work with relational databases.",
  },
  {
    question: "Which key uniquely identifies a record in a table?",
    options: [
      "Foreign Key",
      "Primary Key",
      "Candidate Key",
      "Alternate Key",
    ],
    answer: 1,
    explanation:
      "A primary key uniquely identifies each record in a database table.",
  },
  {
    question: "Which normal form removes repeating groups?",
    options: [
      "First Normal Form",
      "Second Normal Form",
      "Third Normal Form",
      "BCNF",
    ],
    answer: 0,
    explanation:
      "First Normal Form requires each attribute to contain atomic values and removes repeating groups.",
  },
  {
    question: "What does SQL stand for?",
    options: [
      "Simple Query Language",
      "Structured Query Language",
      "System Query Logic",
      "Structured Question Language",
    ],
    answer: 1,
    explanation:
      "SQL stands for Structured Query Language.",
  },
];

function Quiz() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [language, setLanguage] = useState("English");

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizFinished, setQuizFinished] = useState(false);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    const allowedExtensions = [
      ".pdf",
      ".docx",
      ".txt",
      ".jpg",
      ".jpeg",
      ".png",
    ];

    const extension = `.${selectedFile.name
      .split(".")
      .pop()
      .toLowerCase()}`;

    if (!allowedExtensions.includes(extension)) {
      alert("Please upload PDF, DOCX, TXT, JPG, JPEG or PNG.");
      return;
    }

    setFile(selectedFile);

    if (!subject.trim()) {
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, "");
      setSubject(fileName);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const startQuiz = () => {
    if (!file && !topic.trim()) {
      alert("Please upload study material or enter a topic.");
      return;
    }

    setAnswers({});
    setCurrentQuestion(0);
    setQuizFinished(false);
    setQuizStarted(true);
  };

  const selectAnswer = (answerIndex) => {
    setAnswers((previous) => ({
      ...previous,
      [currentQuestion]: answerIndex,
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((previous) => previous + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((previous) => previous - 1);
    }
  };

  const submitQuiz = () => {
    setQuizFinished(true);
  };

  const restartQuiz = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setQuizFinished(false);
    setQuizStarted(true);
  };

  const newQuiz = () => {
    setQuizStarted(false);
    setQuizFinished(false);
    setAnswers({});
    setCurrentQuestion(0);
  };

  const questions = Array.from(
    { length: questionCount },
    (_, index) => sampleQuestions[index % sampleQuestions.length],
  );

  const score = questions.reduce((total, question, index) => {
    return total + (answers[index] === question.answer ? 1 : 0);
  }, 0);

  const percentage = Math.round((score / questions.length) * 100);

  if (quizStarted) {
    if (quizFinished) {
      return (
        <div className="min-h-[calc(100vh-80px)] px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">

            {/* RESULT HEADER */}
            <div className="mb-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <Award size={30} className="text-white" />
              </div>

              <h1 className="mt-5 text-3xl font-bold text-white">
                Quiz Complete
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Here's how you performed.
              </p>
            </div>

            {/* SCORE CARD */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
              <div className="grid gap-5 sm:grid-cols-3">

                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5 text-center">
                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    Score
                  </p>
                  <p className="mt-2 text-3xl font-bold text-white">
                    {score}/{questions.length}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5 text-center">
                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    Percentage
                  </p>
                  <p className="mt-2 text-3xl font-bold text-white">
                    {percentage}%
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5 text-center">
                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    Correct
                  </p>
                  <p className="mt-2 text-3xl font-bold text-white">
                    {score}
                  </p>
                </div>

              </div>
            </div>

            {/* ANSWER REVIEW */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-slate-400" />
                <h2 className="text-sm font-semibold text-white">
                  Answer Review
                </h2>
              </div>

              {questions.map((question, index) => {
                const selected = answers[index];
                const correct = selected === question.answer;

                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          correct
                            ? "bg-white text-black"
                            : "bg-white/[0.06] text-slate-500"
                        }`}
                      >
                        {correct ? (
                          <Check size={15} />
                        ) : (
                          <XCircle size={15} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-6 text-white">
                          {index + 1}. {question.question}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          Your answer:{" "}
                          <span className="text-slate-300">
                            {selected !== undefined
                              ? question.options[selected]
                              : "Not answered"}
                          </span>
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Correct answer:{" "}
                          <span className="text-slate-300">
                            {question.options[question.answer]}
                          </span>
                        </p>

                        <p className="mt-3 text-xs leading-5 text-slate-600">
                          {question.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ACTIONS */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={restartQuiz}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-slate-200"
              >
                <RotateCcw size={17} />
                Retry Quiz
              </button>

              <button
                type="button"
                onClick={newQuiz}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
              >
                <Sparkles size={17} />
                New Quiz
              </button>
            </div>

          </div>
        </div>
      );
    }

    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
      <div className="min-h-[calc(100vh-80px)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">

          {/* QUIZ HEADER */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-600">
                {subject || "AI Quiz"}
              </p>

              <h1 className="mt-1 text-xl font-bold text-white">
                {topic || "Practice Quiz"}
              </h1>
            </div>

            <button
              type="button"
              onClick={newQuiz}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-500 transition hover:bg-white/[0.07] hover:text-white"
              title="Exit Quiz"
            >
              <X size={17} />
            </button>
          </div>

          {/* PROGRESS */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Question {currentQuestion + 1} of {questions.length}
              </span>

              <span className="text-slate-600">
                {Math.round(progress)}%
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-white transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* QUESTION */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-8">

            <div className="mb-7 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
                <BookOpen size={17} className="text-slate-300" />
              </div>

              <div>
                <p className="text-xs text-slate-600">
                  Question {currentQuestion + 1}
                </p>

                <h2 className="mt-1 text-lg font-semibold leading-7 text-white">
                  {question.question}
                </h2>
              </div>
            </div>

            {/* OPTIONS */}
            <div className="space-y-3">
              {question.options.map((option, index) => {
                const selected = answers[currentQuestion] === index;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => selectAnswer(index)}
                    className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-white/20 bg-white/[0.08] text-white ring-1 ring-white/10"
                        : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold ${
                        selected
                          ? "border-white bg-white text-black"
                          : "border-white/10 bg-white/[0.03] text-slate-600"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>

                    <span className="text-sm">
                      {option}
                    </span>

                    {selected && (
                      <Check
                        size={17}
                        className="ml-auto shrink-0"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* NAVIGATION */}
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/10 pt-5">

              <button
                type="button"
                onClick={previousQuestion}
                disabled={currentQuestion === 0}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-400 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={17} />
                Previous
              </button>

              {currentQuestion === questions.length - 1 ? (
                <button
                  type="button"
                  onClick={submitQuiz}
                  className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-slate-200"
                >
                  <Check size={17} />
                  Submit Quiz
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextQuestion}
                  className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-slate-200"
                >
                  Next
                  <ChevronRight size={17} />
                </button>
              )}

            </div>
          </div>

          {/* INFO */}
          <div className="mt-5 flex items-center gap-2 text-xs text-slate-700">
            <Sparkles size={14} />
            <span>
              Frontend demo — questions will be generated by Gemma later.
            </span>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
              <Sparkles size={21} className="text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                AI Quiz
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Test your knowledge with an AI-generated practice quiz.
              </p>
            </div>

          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* LEFT SETTINGS */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">

            <div className="mb-6">
              <h2 className="text-sm font-semibold text-white">
                Quiz Configuration
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                Configure your quiz before starting.
              </p>
            </div>

            <div className="space-y-5">

              {/* SUBJECT */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Subject
                </label>

                <input
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="e.g. DBMS"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-white/20 focus:bg-white/[0.05]"
                />
              </div>

              {/* TOPIC */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Topic
                </label>

                <input
                  type="text"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="e.g. Transactions and Normalization"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-white/20 focus:bg-white/[0.05]"
                />
              </div>

              {/* DIFFICULTY */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Difficulty
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {difficulties.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setDifficulty(item)}
                      className={`rounded-xl border px-3 py-2.5 text-xs transition ${
                        difficulty === item
                          ? "border-white/20 bg-white/[0.08] text-white ring-1 ring-white/10"
                          : "border-white/10 bg-white/[0.02] text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* QUESTION COUNT */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Number of Questions
                </label>

                <div className="grid grid-cols-4 gap-2">
                  {questionCounts.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count)}
                      className={`rounded-xl border py-2.5 text-xs transition ${
                        questionCount === count
                          ? "border-white/20 bg-white/[0.08] text-white"
                          : "border-white/10 bg-white/[0.02] text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* LANGUAGE */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Language
                </label>

                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0b0f18] px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                >
                  {languages.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <button
              type="button"
              onClick={startQuiz}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-slate-200"
            >
              <Zap size={17} />
              Start Quiz
            </button>

          </div>

          {/* RIGHT UPLOAD */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">

            <div className="mb-5">
              <h2 className="text-sm font-semibold text-white">
                Study Material
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                Upload material to generate questions from your notes.
              </p>
            </div>

            {!file ? (
              <label
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-5 text-center transition ${
                  isDragging
                    ? "border-white/30 bg-white/[0.08]"
                    : "border-white/10 bg-white/[0.015] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(event) =>
                    handleFile(event.target.files?.[0])
                  }
                />

                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06]">
                  <Upload size={21} className="text-slate-400" />
                </div>

                <p className="text-sm font-medium text-slate-300">
                  Drop your file here
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  or click to browse
                </p>

                <p className="mt-4 text-[10px] uppercase tracking-wider text-slate-700">
                  PDF · DOCX · TXT · JPG · PNG
                </p>
              </label>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.07]">
                    <FileText
                      size={19}
                      className="text-slate-300"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.08] hover:text-white"
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>

                </div>
              </div>
            )}

            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-start gap-3">
                <Sparkles
                  size={16}
                  className="mt-0.5 shrink-0 text-slate-600"
                />

                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Local AI
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-700">
                    Gemma will generate questions from your study
                    material once backend integration is connected.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default Quiz;