import { useState } from "react";
import {
  BookOpen,
  Check,
  FileText,
  Printer,
  Sparkles,
  Upload,
  X,
  Zap,
} from "lucide-react";

const questionTypes = [
  "Short Answer",
  "Long Answer",
  "Mixed",
];

const marksOptions = Array.from(
  { length: 20 },
  (_, index) => index + 1,
);

const questionCounts = [5, 10, 20, 30];

const sampleShortQuestions = [
  {
    question: "What is a transaction in DBMS?",
    answer:
      "A transaction is a sequence of database operations treated as a single logical unit of work. It must either complete successfully or be completely rolled back.",
  },
  {
    question: "What is a Primary Key?",
    answer:
      "A Primary Key is an attribute or set of attributes that uniquely identifies every record in a database table. It cannot contain duplicate or NULL values.",
  },
  {
    question: "What is normalization?",
    answer:
      "Normalization is the process of organizing data in a database to reduce redundancy and improve data integrity.",
  },
  {
    question: "What is a foreign key?",
    answer:
      "A foreign key is an attribute in one table that refers to the primary key of another table and establishes a relationship between the tables.",
  },
  {
    question: "What is SQL?",
    answer:
      "SQL stands for Structured Query Language. It is used to create, retrieve, update and manage data in relational databases.",
  },
];

const sampleLongQuestions = [
  {
    question: "Explain the ACID properties of a transaction.",
    answer:
      "ACID stands for Atomicity, Consistency, Isolation and Durability. Atomicity ensures that all operations of a transaction are completed or none are applied. Consistency ensures that the database remains in a valid state. Isolation prevents concurrent transactions from interfering with each other. Durability ensures that committed changes remain saved even after a system failure.",
  },
  {
    question: "Explain the different normal forms in DBMS.",
    answer:
      "Normalization is divided into several normal forms. First Normal Form removes repeating groups and requires atomic values. Second Normal Form removes partial dependency on a composite key. Third Normal Form removes transitive dependency. BCNF is a stronger version of Third Normal Form where every determinant must be a candidate key.",
  },
  {
    question: "Explain the three-schema architecture of DBMS.",
    answer:
      "The three-schema architecture consists of the external, conceptual and internal levels. The external level describes individual user views. The conceptual level describes the complete logical structure of the database. The internal level describes how data is physically stored. This architecture provides data abstraction and data independence.",
  },
  {
    question: "Explain concurrency control in DBMS.",
    answer:
      "Concurrency control manages simultaneous transactions while maintaining database consistency. Techniques such as locking, timestamp ordering and optimistic concurrency control are used to prevent problems like lost updates, dirty reads and inconsistent results.",
  },
  {
    question: "Explain the role of a database administrator.",
    answer:
      "A database administrator manages and maintains databases. Responsibilities include database security, backup and recovery, performance optimization, user authorization, storage management and ensuring database availability.",
  },
];

function TestPaper() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [questionType, setQuestionType] =
    useState("Short Answer");
  const [marks, setMarks] = useState("5");
  const [questionCount, setQuestionCount] = useState(5);

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [generated, setGenerated] = useState(false);

  const handleFile = (selectedFile) => {
    if (!selectedFile) {
      return;
    }

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
      alert(
        "Please upload PDF, DOCX, TXT, JPG, JPEG or PNG.",
      );
      return;
    }

    setFile(selectedFile);

    if (!subject.trim()) {
      const fileName = selectedFile.name.replace(
        /\.[^/.]+$/,
        "",
      );

      setSubject(fileName);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile =
      event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const generatePaper = () => {
    if (
      !file &&
      !topic.trim() &&
      !subject.trim()
    ) {
      alert(
        "Please enter a subject/topic or upload study material.",
      );
      return;
    }

    setGenerated(true);
  };

  const generateAnother = () => {
    setGenerated(false);
  };

  const printAnswers = () => {
    window.print();
  };

  const totalMarks =
    Number(questionCount) * Number(marks);

  const createQuestions = () => {
    if (questionType === "Short Answer") {
      return Array.from(
        { length: questionCount },
        (_, index) => ({
          ...sampleShortQuestions[
            index % sampleShortQuestions.length
          ],
          type: "Short Answer",
        }),
      );
    }

    if (questionType === "Long Answer") {
      return Array.from(
        { length: questionCount },
        (_, index) => ({
          ...sampleLongQuestions[
            index % sampleLongQuestions.length
          ],
          type: "Long Answer",
        }),
      );
    }

    return Array.from(
      { length: questionCount },
      (_, index) => {
        const isShort = index % 2 === 0;

        const source = isShort
          ? sampleShortQuestions
          : sampleLongQuestions;

        return {
          ...source[
            Math.floor(index / 2) % source.length
          ],
          type: isShort
            ? "Short Answer"
            : "Long Answer",
        };
      },
    );
  };

  const questions = createQuestions();

  /* =========================
     GENERATED ANSWER KEY
  ========================= */

  if (generated) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] overflow-hidden px-4 py-7 sm:px-6 lg:px-8">
        {/* Teal atmosphere */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-[5%] top-[5%] h-[430px] w-[430px] rounded-full blur-[150px]"
            style={{
              background:
                "rgba(13,148,136,0.07)",
            }}
          />

          <div
            className="absolute right-[5%] top-[35%] h-[400px] w-[400px] rounded-full blur-[150px]"
            style={{
              background:
                "rgba(20,184,166,0.045)",
            }}
          />

          <div
            className="absolute bottom-[5%] left-[35%] h-[300px] w-[300px] rounded-full blur-[130px]"
            style={{
              background:
                "rgba(8,145,178,0.035)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-teal-300">
                <Sparkles size={13} />
                Generated Answer Key
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {subject ||
                  "Generated Test Paper"}
              </h1>

              {topic && (
                <p className="mt-1 text-xs text-slate-500">
                  Topic: {topic}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={generateAnother}
                className="flex items-center gap-2 rounded-xl border border-teal-100/[0.08] bg-white/[0.025] px-4 py-2.5 text-[10px] text-slate-400 transition hover:border-teal-300/15 hover:bg-teal-400/[0.04] hover:text-teal-200"
              >
                <Sparkles size={14} />
                Generate Another
              </button>

              <button
                type="button"
                onClick={printAnswers}
                className="flex items-center gap-2 rounded-xl border border-teal-300/20 bg-teal-400/[0.08] px-4 py-2.5 text-[10px] font-semibold text-teal-100 transition hover:bg-teal-400/[0.13]"
              >
                <Printer size={14} />
                Print Answers
              </button>
            </div>
          </div>

          {/* Paper Info */}
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <InfoCard
              label="Question Type"
              value={questionType}
            />

            <InfoCard
              label="Marks / Question"
              value={marks}
            />

            <InfoCard
              label="Questions"
              value={questionCount}
            />

            <InfoCard
              label="Total Marks"
              value={totalMarks}
              highlight
            />

            <InfoCard
              label="Material"
              value={
                file ? file.name : "Topic based"
              }
            />
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen
                size={17}
                className="text-teal-300"
              />

              <h2 className="text-sm font-semibold text-white">
                Questions + Answers
              </h2>
            </div>

            {questions.map((item, index) => (
              <div
                key={`${item.question}-${index}`}
                className="rounded-2xl border border-teal-100/[0.08] bg-[#061214]/65 p-5 shadow-[0_15px_45px_rgba(0,0,0,0.16)] backdrop-blur-2xl sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-teal-300/15 bg-teal-400/[0.05] text-xs font-semibold text-teal-200">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-teal-300/10 bg-teal-400/[0.035] px-2.5 py-1 text-[9px] text-teal-200/70">
                        {item.type}
                      </span>

                      <span className="rounded-full border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 text-[9px] text-slate-500">
                        {marks}{" "}
                        {Number(marks) === 1
                          ? "Mark"
                          : "Marks"}
                      </span>
                    </div>

                    <h3 className="mt-3 text-sm font-semibold leading-6 text-white">
                      {item.question}
                    </h3>

                    <div className="mt-4 rounded-xl border border-teal-300/10 bg-black/20 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Check
                          size={14}
                          className="text-teal-300/70"
                        />

                        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-teal-200/50">
                          Reference Answer
                        </span>
                      </div>

                      <p className="text-xs leading-6 text-slate-400 sm:text-sm">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Notice */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-teal-100/[0.07] bg-teal-400/[0.025] p-4">
            <Sparkles
              size={15}
              className="mt-0.5 shrink-0 text-teal-300/60"
            />

            <div>
              <p className="text-[10px] font-medium text-teal-200/60">
                AI Answer Key
              </p>

              <p className="mt-1 text-[10px] leading-5 text-slate-600">
                These are frontend demo questions.
                Gemma will generate questions and
                reference answers after backend
                integration.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     CONFIGURATION PAGE
  ========================= */

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden px-4 py-7 sm:px-6 lg:px-8">
      {/* Teal Background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-[5%] top-[5%] h-[450px] w-[450px] rounded-full blur-[160px]"
          style={{
            background:
              "rgba(13,148,136,0.065)",
          }}
        />

        <div
          className="absolute right-[3%] top-[30%] h-[430px] w-[430px] rounded-full blur-[160px]"
          style={{
            background:
              "rgba(20,184,166,0.045)",
          }}
        />

        <div
          className="absolute bottom-[0%] left-[40%] h-[350px] w-[350px] rounded-full blur-[140px]"
          style={{
            background:
              "rgba(8,145,178,0.035)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-teal-300/15 bg-teal-400/[0.05]">
              <FileText
                size={21}
                className="text-teal-200"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Test Paper
              </h1>

              <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">
                Generate short and long answer
                questions with reference answers.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
          {/* Configuration */}
          <div className="rounded-2xl border border-teal-100/[0.08] bg-[#061214]/65 p-5 shadow-[0_15px_50px_rgba(0,0,0,0.18)] backdrop-blur-2xl sm:p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <Zap
                  size={15}
                  className="text-teal-300"
                />

                <h2 className="text-sm font-semibold text-white">
                  Paper Configuration
                </h2>
              </div>

              <p className="mt-1 text-[10px] text-slate-600">
                Configure the type and size of your
                test paper.
              </p>
            </div>

            <div className="space-y-5">
              {/* Subject */}
              <div>
                <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Subject
                </label>

                <input
                  type="text"
                  value={subject}
                  onChange={(event) =>
                    setSubject(event.target.value)
                  }
                  placeholder="e.g. DBMS"
                  className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 text-xs text-slate-100 outline-none placeholder:text-slate-600 transition focus:border-teal-300/25 focus:bg-teal-400/[0.025]"
                />
              </div>

              {/* Topic */}
              <div>
                <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Topic
                </label>

                <input
                  type="text"
                  value={topic}
                  onChange={(event) =>
                    setTopic(event.target.value)
                  }
                  placeholder="e.g. Transactions"
                  className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 text-xs text-slate-100 outline-none placeholder:text-slate-600 transition focus:border-teal-300/25 focus:bg-teal-400/[0.025]"
                />
              </div>

              {/* Question Type */}
              <div>
                <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Question Type
                </label>

                <div className="grid gap-2 sm:grid-cols-3">
                  {questionTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setQuestionType(type)
                      }
                      className={`rounded-xl border px-3 py-3 text-[10px] transition ${
                        questionType === type
                          ? "border-teal-300/25 bg-teal-400/[0.08] text-teal-100 ring-1 ring-teal-300/10"
                          : "border-white/[0.07] bg-black/20 text-slate-500 hover:border-teal-300/15 hover:bg-teal-400/[0.035] hover:text-slate-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Marks */}
              <div>
                <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Marks per Question
                </label>

                <select
                  value={marks}
                  onChange={(event) =>
                    setMarks(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/[0.08] bg-[#081517] px-4 py-3 text-xs text-slate-200 outline-none focus:border-teal-300/25"
                >
                  {marksOptions.map((mark) => (
                    <option
                      key={mark}
                      value={mark}
                    >
                      {mark}{" "}
                      {mark === 1
                        ? "Mark"
                        : "Marks"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Question Count */}
              <div>
                <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Number of Questions
                </label>

                <div className="grid grid-cols-4 gap-2">
                  {questionCounts.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() =>
                        setQuestionCount(count)
                      }
                      className={`rounded-xl border py-3 text-[10px] transition ${
                        questionCount === count
                          ? "border-teal-300/25 bg-teal-400/[0.08] text-teal-100 ring-1 ring-teal-300/10"
                          : "border-white/[0.07] bg-black/20 text-slate-500 hover:border-teal-300/15 hover:bg-teal-400/[0.035] hover:text-slate-300"
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 rounded-xl border border-teal-300/10 bg-teal-400/[0.025] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-600">
                  Total Marks
                </span>

                <span className="text-lg font-semibold text-teal-100">
                  {totalMarks}
                </span>
              </div>

              <div className="mt-3 h-px bg-white/[0.06]" />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[9px]">
                <span className="text-slate-600">
                  {questionCount} questions ×{" "}
                  {marks} marks
                </span>

                <span className="text-teal-200/50">
                  {questionType}
                </span>
              </div>
            </div>

            {/* Generate */}
            <button
              type="button"
              onClick={generatePaper}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-teal-300/20 bg-teal-400/[0.08] px-5 py-3.5 text-xs font-semibold text-teal-100 transition hover:border-teal-300/30 hover:bg-teal-400/[0.13]"
            >
              <Zap size={16} />
              Generate Answer Key
            </button>
          </div>

          {/* Upload */}
          <div className="rounded-2xl border border-teal-100/[0.08] bg-[#061214]/65 p-5 shadow-[0_15px_50px_rgba(0,0,0,0.18)] backdrop-blur-2xl sm:p-6">
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <BookOpen
                  size={15}
                  className="text-teal-300"
                />

                <h2 className="text-sm font-semibold text-white">
                  Study Material
                </h2>
              </div>

              <p className="mt-1 text-[10px] leading-5 text-slate-600">
                Upload notes or study material to
                generate relevant questions.
              </p>
            </div>

            {!file ? (
              <label
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() =>
                  setIsDragging(false)
                }
                onDrop={handleDrop}
                className={`flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-5 text-center transition ${
                  isDragging
                    ? "border-teal-300/35 bg-teal-400/[0.08]"
                    : "border-white/[0.09] bg-black/20 hover:border-teal-300/20 hover:bg-teal-400/[0.035]"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(event) =>
                    handleFile(
                      event.target.files?.[0],
                    )
                  }
                />

                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-teal-300/15 bg-teal-400/[0.05]">
                  <Upload
                    size={21}
                    className="text-teal-300"
                  />
                </div>

                <p className="text-xs font-medium text-slate-300">
                  Drop your file here
                </p>

                <p className="mt-1 text-[10px] text-slate-600">
                  or click to browse
                </p>

                <p className="mt-4 text-[8px] uppercase tracking-[0.15em] text-slate-700">
                  PDF · DOCX · TXT · JPG · JPEG · PNG
                </p>
              </label>
            ) : (
              <div className="rounded-xl border border-teal-300/15 bg-teal-400/[0.035] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-teal-300/15 bg-teal-400/[0.06]">
                    <FileText
                      size={19}
                      className="text-teal-300"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-200">
                      {file.name}
                    </p>

                    <p className="mt-1 text-[9px] text-slate-600">
                      {(
                        file.size /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB · Ready
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="mt-5 rounded-xl border border-teal-300/10 bg-teal-400/[0.02] p-4">
              <div className="flex items-start gap-3">
                <Sparkles
                  size={15}
                  className="mt-0.5 shrink-0 text-teal-300/60"
                />

                <div>
                  <p className="text-[10px] font-medium text-teal-200/60">
                    How it works
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-slate-600">
                    Upload your material or enter a
                    topic. Gemma will later generate
                    questions and reference answers
                    based on your selected configuration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-7 flex items-center justify-center gap-2 py-3">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-300/60" />

          <span className="text-[8px] uppercase tracking-[0.18em] text-slate-600">
            OFFSEDU · Local AI · Gemma · Ollama
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================
   SMALL COMPONENTS
========================= */

function InfoCard({
  label,
  value,
  highlight = false,
}) {
  return (
    <div className="rounded-xl border border-teal-100/[0.07] bg-[#061214]/60 p-4 backdrop-blur-xl">
      <p className="text-[8px] uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>

      <p
        className={`mt-1 truncate text-xs font-medium ${
          highlight
            ? "text-teal-200"
            : "text-slate-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default TestPaper;