import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  FileText,
  Image,
  Languages,
  Play,
  RotateCcw,
  Trophy,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import { generateQuiz } from "../services/quizService";
import { uploadDocument } from "../services/documentService";

const languages = ["English", "Hindi", "Marathi", "Urdu"];
const difficulties = ["Easy", "Medium", "Hard"];
const questionCounts = [5, 10, 20, 30];

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

  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [documentId, setDocumentId] = useState(null);
  const [questions, setQuestions] = useState([]);

  const fileInputRef = useRef(null);

  const handleFile = (selectedFile) => {
    if (!selectedFile) {
      return;
    }

    const extension =
      "." +
      selectedFile.name.split(".").pop().toLowerCase();

    const allowed = [
      ".pdf",
      ".docx",
      ".txt",
      ".jpg",
      ".jpeg",
      ".png",
    ];

    if (!allowed.includes(extension)) {
      setStatusMessage(
        "Please upload PDF, DOCX, TXT, JPG, JPEG or PNG files.",
      );
      return;
    }

    setFile(selectedFile);
    setDocumentId(null);
    setStatusMessage("");

    if (!subject.trim()) {
      const filename = selectedFile.name.replace(
        /\.[^/.]+$/,
        "",
      );

      setSubject(filename);
    }
  };

  const handleFileChange = (event) => {
    handleFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    handleFile(event.dataTransfer.files?.[0]);
  };

  const removeFile = () => {
    setFile(null);
    setDocumentId(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startQuiz = async () => {
    const selectedTopic =
      topic.trim() ||
      (file
        ? "ALL"
        : subject.trim());

    if (!selectedTopic && !file) {
      setStatusMessage(
        "Please enter a subject/topic or upload study material first.",
      );
      return;
    }

    setIsGenerating(true);
    setStatusMessage("");
    setQuizStarted(false);

    try {
      let selectedDocumentId = documentId;

      if (file && !selectedDocumentId) {
        setStatusMessage(
          "Uploading and processing your study material...",
        );

        const uploadResult = await uploadDocument(file);

        if (
          !uploadResult?.success ||
          !uploadResult?.document_id
        ) {
          throw new Error(
            uploadResult?.error ||
              "Unable to process the study material.",
          );
        }

        selectedDocumentId = uploadResult.document_id;
        setDocumentId(selectedDocumentId);

        setStatusMessage(
          "Study material processed. Generating quiz...",
        );
      }

      const data = await generateQuiz({
        topic: selectedTopic,
        numQuestions: questionCount,
        documentId: selectedDocumentId,
        difficulty,
        language,
      });

      const generatedQuestions = Array.isArray(data?.questions)
        ? data.questions
        : Array.isArray(data)
          ? data
          : [];

      if (!generatedQuestions.length) {
        throw new Error(
          "The AI did not return any quiz questions.",
        );
      }

      setQuestions(generatedQuestions);
      setAnswers({});
      setCurrentQuestion(0);
      setQuizFinished(false);
      setQuizStarted(true);
      setStatusMessage("");
    } catch (error) {
      console.error("Quiz generation error:", error);

      setStatusMessage(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Unable to generate quiz. Please check the backend.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const selectAnswer = (answerIndex) => {
    if (quizFinished) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion]: answerIndex,
    }));
  };

  const goNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((previous) => previous + 1);
    }
  };

  const goPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((previous) => previous - 1);
    }
  };

  const submitQuiz = () => {
    setQuizFinished(true);
  };

  const calculateScore = () => {
    return questions.reduce((score, question, index) => {
      return score + (answers[index] === question.answer ? 1 : 0);
    }, 0);
  };

  const retryQuiz = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setQuizFinished(false);
  };

  const createNewQuiz = () => {
    setQuizStarted(false);
    setQuizFinished(false);
    setCurrentQuestion(0);
    setAnswers({});
    setStatusMessage("");
  };

  const score = calculateScore();
  const percentage =
    questions.length > 0
      ? Math.round((score / questions.length) * 100)
      : 0;

  if (quizStarted) {
    return (
      <QuizInterface
        questions={questions}
        currentQuestion={currentQuestion}
        answers={answers}
        quizFinished={quizFinished}
        score={score}
        percentage={percentage}
        onSelectAnswer={selectAnswer}
        onNext={goNext}
        onPrevious={goPrevious}
        onSubmit={submitQuiz}
        onRetry={retryQuiz}
        onNewQuiz={createNewQuiz}
        subject={subject}
        topic={topic}
        difficulty={difficulty}
        language={language}
      />
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute left-[5%] top-[8%] h-[430px] w-[430px] rounded-full blur-[150px]"
          style={{
            background: "rgba(13,148,136,0.07)",
          }}
        />

        <div
          className="absolute right-[5%] top-[35%] h-[400px] w-[400px] rounded-full blur-[150px]"
          style={{
            background: "rgba(20,184,166,0.045)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/15 bg-teal-400/[0.045] px-3 py-1.5">
            <Zap size={13} className="text-teal-300" />

            <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-teal-200">
              AI Assessment
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Quiz
          </h1>

          <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-400 sm:text-sm">
            Test your knowledge with AI-generated multiple-choice
            questions from your study material.
          </p>
        </div>

        {/* Main grid */}
        <div className="grid gap-5 lg:grid-cols-[390px_minmax(0,1fr)]">
          {/* Settings */}
          <section className="h-fit rounded-2xl border border-teal-100/[0.08] bg-[#061214]/72 p-5 shadow-[0_15px_50px_rgba(0,0,0,0.20)] backdrop-blur-2xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-300/15 bg-teal-400/[0.06]">
                <Zap size={18} className="text-teal-300" />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-white">
                  Quiz Settings
                </h2>

                <p className="mt-0.5 text-[9px] text-slate-500">
                  Configure your practice session.
                </p>
              </div>
            </div>

            {/* Subject */}
            <div className="mb-4">
              <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Subject
              </label>

              <input
                type="text"
                value={subject}
                onChange={(event) =>
                  setSubject(event.target.value)
                }
                placeholder="e.g. DBMS"
                className="w-full rounded-xl border border-white/[0.08] bg-black/25 px-3 py-3 text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-teal-300/25"
              />
            </div>

            {/* Topic */}
            <div className="mb-4">
              <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Topic
              </label>

              <input
                type="text"
                value={topic}
                onChange={(event) =>
                  setTopic(event.target.value)
                }
                placeholder="e.g. Normalization"
                className="w-full rounded-xl border border-white/[0.08] bg-black/25 px-3 py-3 text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-teal-300/25"
              />
            </div>

            {/* Difficulty */}
            <div className="mb-4">
              <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Difficulty
              </label>

              <div className="grid grid-cols-3 gap-2">
                {difficulties.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setDifficulty(item)}
                    className={`rounded-xl border px-2 py-2.5 text-[9px] font-medium transition ${
                      difficulty === item
                        ? "border-teal-300/25 bg-teal-400/[0.08] text-teal-200"
                        : "border-white/[0.07] bg-black/20 text-slate-500 hover:border-white/10 hover:text-slate-300"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Question count */}
            <div className="mb-4">
              <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Questions
              </label>

              <div className="grid grid-cols-4 gap-2">
                {questionCounts.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`rounded-xl border px-2 py-2.5 text-[9px] font-medium transition ${
                      questionCount === count
                        ? "border-teal-300/25 bg-teal-400/[0.08] text-teal-200"
                        : "border-white/[0.07] bg-black/20 text-slate-500 hover:border-white/10 hover:text-slate-300"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="mb-5">
              <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Language
              </label>

              <div className="relative">
                <Languages
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-teal-300"
                />

                <select
                  value={language}
                  onChange={(event) =>
                    setLanguage(event.target.value)
                  }
                  className="w-full appearance-none rounded-xl border border-white/[0.08] bg-[#081517] py-3 pl-9 pr-3 text-xs text-slate-200 outline-none focus:border-teal-300/25"
                >
                  {languages.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Upload */}
            <div>
              <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Study Material
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />

              {!file ? (
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() =>
                    setIsDragging(false)
                  }
                  onDrop={handleDrop}
                  className={`flex w-full flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center transition ${
                    isDragging
                      ? "border-teal-300/40 bg-teal-400/[0.08]"
                      : "border-white/[0.10] bg-black/20 hover:border-teal-300/20 hover:bg-teal-400/[0.035]"
                  }`}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-teal-300/15 bg-teal-400/[0.05]">
                    <Upload
                      size={18}
                      className="text-teal-300"
                    />
                  </div>

                  <p className="text-[10px] font-medium text-slate-300">
                    Drop your file here
                  </p>

                  <p className="mt-1 text-[9px] text-slate-600">
                    or click to browse
                  </p>

                  <p className="mt-3 text-[8px] text-slate-600">
                    PDF · DOCX · TXT · JPG · JPEG · PNG
                  </p>
                </button>
              ) : (
                <div className="rounded-xl border border-teal-300/15 bg-teal-400/[0.035] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-teal-300/15 bg-teal-400/[0.06]">
                      {file.type.startsWith("image/") ? (
                        <Image
                          size={16}
                          className="text-teal-300"
                        />
                      ) : (
                        <FileText
                          size={16}
                          className="text-teal-300"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-medium text-slate-200">
                        {file.name}
                      </p>

                      <p className="mt-0.5 text-[8px] text-slate-500">
                        Ready for quiz generation
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={removeFile}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-white/[0.05] hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            {statusMessage && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300/10 bg-amber-400/[0.035] px-3 py-2.5">
                <AlertCircle
                  size={14}
                  className="mt-0.5 shrink-0 text-amber-300"
                />

                <p className="text-[9px] leading-4 text-amber-200/80">
                  {statusMessage}
                </p>
              </div>
            )}

            {/* Start */}
            <button
              type="button"
              onClick={startQuiz}
              disabled={isGenerating}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-teal-300/20 bg-teal-400/[0.08] px-4 py-3 text-xs font-semibold text-teal-100 transition hover:border-teal-300/30 hover:bg-teal-400/[0.13] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-200/30 border-t-teal-200" />
                  Preparing Quiz...
                </>
              ) : (
                <>
                  <Play size={14} />
                  Start Quiz
                </>
              )}
            </button>
          </section>

          {/* Preview */}
          <section className="flex min-h-[620px] flex-col rounded-2xl border border-teal-100/[0.08] bg-[#061214]/65 shadow-[0_15px_50px_rgba(0,0,0,0.20)] backdrop-blur-2xl">
            <div className="border-b border-teal-100/[0.08] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-300/15 bg-teal-400/[0.06]">
                  <Trophy
                    size={17}
                    className="text-teal-300"
                  />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Quiz Preview
                  </h2>

                  <p className="mt-0.5 text-[9px] text-slate-500">
                    Your quiz configuration
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center px-5 py-8">
              <div className="w-full max-w-lg">
                <div className="mb-8 text-center">
                  <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-teal-300/15 bg-teal-400/[0.045]">
                    <div className="absolute -inset-4 rounded-full bg-teal-400/[0.04] blur-2xl" />

                    <Trophy
                      size={32}
                      strokeWidth={1.5}
                      className="relative text-teal-200"
                    />
                  </div>

                  <h3 className="text-lg font-semibold text-white">
                    Ready for your quiz?
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-[10px] leading-5 text-slate-500">
                    Configure your quiz on the left and start your
                    practice session.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <PreviewItem
                    label="Difficulty"
                    value={difficulty}
                  />

                  <PreviewItem
                    label="Questions"
                    value={`${questionCount} Questions`}
                  />

                  <PreviewItem
                    label="Language"
                    value={language}
                  />

                  <PreviewItem
                    label="Topic"
                    value={topic || subject || "Not selected"}
                  />
                </div>

                <div className="mt-5 rounded-xl border border-teal-300/10 bg-teal-400/[0.025] p-4">
                  <div className="flex items-start gap-3">
                    <Circle
                      size={13}
                      className="mt-0.5 fill-teal-300 text-teal-300"
                    />

                    <p className="text-[9px] leading-5 text-slate-500">
                      Questions will be generated from your selected
                      topic or uploaded material after the local Gemma
                      backend is connected.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 py-3">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-300/70 shadow-[0_0_8px_rgba(45,212,191,0.5)]" />

          <span className="text-[8px] uppercase tracking-[0.18em] text-slate-500">
            OFFSEDU · Local AI · Gemma · Ollama
          </span>
        </div>
      </div>
    </div>
  );
}

function QuizInterface({
  questions,
  currentQuestion,
  answers,
  quizFinished,
  score,
  percentage,
  onSelectAnswer,
  onNext,
  onPrevious,
  onSubmit,
  onRetry,
  onNewQuiz,
  subject,
  topic,
  difficulty,
  language,
}) {
  if (quizFinished) {
    return (
      <QuizResult
        questions={questions}
        answers={answers}
        score={score}
        percentage={percentage}
        onRetry={onRetry}
        onNewQuiz={onNewQuiz}
        subject={subject}
        topic={topic}
        difficulty={difficulty}
        language={language}
      />
    );
  }

  const question = questions[currentQuestion];
  const selectedAnswer = answers[currentQuestion];
  const progress =
    ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-[10%] top-[15%] h-[400px] w-[400px] rounded-full blur-[150px]"
          style={{
            background: "rgba(13,148,136,0.06)",
          }}
        />

        <div
          className="absolute right-[5%] bottom-[10%] h-[350px] w-[350px] rounded-full blur-[150px]"
          style={{
            background: "rgba(20,184,166,0.04)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Top bar */}
        <div className="mb-5 rounded-2xl border border-teal-100/[0.08] bg-[#061214]/70 p-4 backdrop-blur-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-teal-300" />

                <h1 className="text-sm font-semibold text-white">
                  {subject || "AI Quiz"}
                </h1>
              </div>

              <p className="mt-1 text-[9px] text-slate-500">
                {topic || "General Practice"} · {difficulty} ·{" "}
                {language}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-[9px] uppercase tracking-wider text-slate-500">
                Question
              </p>

              <p className="mt-1 text-sm font-semibold text-teal-200">
                {currentQuestion + 1}
                <span className="text-slate-600">
                  {" "}
                  / {questions.length}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-full rounded-full bg-teal-400/60 transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        {/* Question */}
        <section className="rounded-2xl border border-teal-100/[0.08] bg-[#061214]/70 p-5 shadow-[0_15px_50px_rgba(0,0,0,0.20)] backdrop-blur-2xl sm:p-7">
          <div className="mb-6">
            <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-teal-300">
              Question {currentQuestion + 1}
            </span>

            <h2 className="mt-3 text-base font-semibold leading-7 text-white sm:text-lg">
              {question.question}
            </h2>
          </div>

          <div className="space-y-3">
            {question.options.map((option, index) => {
              const selected = selectedAnswer === index;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onSelectAnswer(index)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                    selected
                      ? "border-teal-300/25 bg-teal-400/[0.08] text-teal-100"
                      : "border-white/[0.07] bg-black/20 text-slate-300 hover:border-teal-300/15 hover:bg-teal-400/[0.035]"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[10px] font-semibold ${
                      selected
                        ? "border-teal-300/25 bg-teal-400/[0.08] text-teal-200"
                        : "border-white/[0.08] bg-white/[0.025] text-slate-500"
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>

                  <span className="text-xs leading-5">
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Controls */}
          <div className="mt-7 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-5">
            <button
              type="button"
              onClick={onPrevious}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-black/20 px-4 py-2.5 text-[10px] text-slate-400 transition hover:border-teal-300/15 hover:text-teal-200 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={14} />
              Previous
            </button>

            {currentQuestion === questions.length - 1 ? (
              <button
                type="button"
                onClick={onSubmit}
                disabled={Object.keys(answers).length === 0}
                className="flex items-center gap-2 rounded-xl border border-teal-300/20 bg-teal-400/[0.08] px-4 py-2.5 text-[10px] font-semibold text-teal-100 transition hover:bg-teal-400/[0.13] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <CheckCircle2 size={14} />
                Submit Quiz
              </button>
            ) : (
              <button
                type="button"
                onClick={onNext}
                className="flex items-center gap-2 rounded-xl border border-teal-300/20 bg-teal-400/[0.08] px-4 py-2.5 text-[10px] font-semibold text-teal-100 transition hover:bg-teal-400/[0.13]"
              >
                Next
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function QuizResult({
  questions,
  answers,
  score,
  percentage,
  onRetry,
  onNewQuiz,
  subject,
  topic,
}) {
  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-[10%] top-[10%] h-[400px] w-[400px] rounded-full blur-[150px]"
          style={{
            background: "rgba(13,148,136,0.07)",
          }}
        />

        <div
          className="absolute right-[5%] top-[40%] h-[350px] w-[350px] rounded-full blur-[150px]"
          style={{
            background: "rgba(20,184,166,0.04)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Result Header */}
        <div className="mb-5 rounded-2xl border border-teal-100/[0.08] bg-[#061214]/70 p-6 text-center backdrop-blur-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-teal-300/15 bg-teal-400/[0.06]">
            <Trophy
              size={34}
              strokeWidth={1.5}
              className="text-teal-200"
            />
          </div>

          <p className="mt-5 text-[9px] font-medium uppercase tracking-[0.2em] text-teal-300">
            Quiz Completed
          </p>

          <h1 className="mt-2 text-2xl font-bold text-white">
            Your Result
          </h1>

          <p className="mt-2 text-[10px] text-slate-500">
            {subject || "AI Quiz"}
            {topic ? ` · ${topic}` : ""}
          </p>

          <div className="mx-auto mt-7 flex max-w-md items-center justify-center gap-8">
            <ResultStat
              value={`${score}/${questions.length}`}
              label="Score"
            />

            <div className="h-10 w-px bg-white/[0.08]" />

            <ResultStat
              value={`${percentage}%`}
              label="Percentage"
            />
          </div>
        </div>

        {/* Review */}
        <section className="rounded-2xl border border-teal-100/[0.08] bg-[#061214]/70 p-5 backdrop-blur-2xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Answer Review
              </h2>

              <p className="mt-1 text-[9px] text-slate-500">
                Review your answers and explanations.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {questions.map((question, index) => {
              const selected = answers[index];
              const correct = selected === question.answer;

              return (
                <div
                  key={question.question}
                  className="rounded-xl border border-white/[0.06] bg-black/20 p-4"
                >
                  <div className="flex items-start gap-3">
                    {correct ? (
                      <CheckCircle2
                        size={16}
                        className="mt-0.5 shrink-0 text-teal-300"
                      />
                    ) : (
                      <AlertCircle
                        size={16}
                        className="mt-0.5 shrink-0 text-slate-500"
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium leading-5 text-slate-200">
                        {index + 1}. {question.question}
                      </p>

                      <p className="mt-2 text-[9px] leading-5 text-slate-500">
                        Your answer:{" "}
                        {selected !== undefined
                          ? question.options[selected]
                          : "Not answered"}
                      </p>

                      <p className="mt-1 text-[9px] leading-5 text-teal-200/70">
                        Correct answer:{" "}
                        {question.options[question.answer]}
                      </p>

                      <p className="mt-2 border-t border-white/[0.05] pt-2 text-[9px] leading-5 text-slate-500">
                        {question.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onRetry}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-teal-300/20 bg-teal-400/[0.07] px-4 py-3 text-[10px] font-semibold text-teal-100 transition hover:bg-teal-400/[0.12]"
            >
              <RotateCcw size={14} />
              Retry Quiz
            </button>

            <button
              type="button"
              onClick={onNewQuiz}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 text-[10px] font-medium text-slate-400 transition hover:border-teal-300/15 hover:text-teal-200"
            >
              <Play size={14} />
              Create New Quiz
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function PreviewItem({ label, value }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
      <p className="text-[8px] uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-1 truncate text-[10px] font-medium text-slate-300">
        {value}
      </p>
    </div>
  );
}

function ResultStat({ value, label }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold text-teal-200">
        {value}
      </p>

      <p className="mt-1 text-[8px] uppercase tracking-wider text-slate-600">
        {label}
      </p>
    </div>
  );
}

export default Quiz;