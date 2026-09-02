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

const marksOptions = Array.from({ length: 20 }, (_, index) => index + 1);

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
  const [questionType, setQuestionType] = useState("Short Answer");
  const [marks, setMarks] = useState("5");
  const [questionCount, setQuestionCount] = useState(5);

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [generated, setGenerated] = useState(false);

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

  const generatePaper = () => {
    if (!file && !topic.trim() && !subject.trim()) {
      alert("Please enter a subject/topic or upload study material.");
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
          ...sampleShortQuestions[index % sampleShortQuestions.length],
          type: "Short Answer",
        }),
      );
    }

    if (questionType === "Long Answer") {
      return Array.from(
        { length: questionCount },
        (_, index) => ({
          ...sampleLongQuestions[index % sampleLongQuestions.length],
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

  if (generated) {
    return (
      <div className="min-h-[calc(100vh-80px)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">

          {/* RESULT HEADER */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="mb-2 flex items-center gap-2 text-xs text-slate-600">
                <Sparkles size={14} />
                Generated Answer Key
              </div>

              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                {subject || "Generated Test Paper"}
              </h1>

              {topic && (
                <p className="mt-1 text-sm text-slate-500">
                  Topic: {topic}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={generateAnother}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
              >
                <Sparkles size={16} />
                Generate Another
              </button>

              <button
                type="button"
                onClick={printAnswers}
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-slate-200"
              >
                <Printer size={16} />
                Print Answers
              </button>
            </div>

          </div>

          {/* PAPER INFO */}
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-600">
                Question Type
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                {questionType}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-600">
                Marks / Question
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                {marks}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-600">
                Questions
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                {questionCount}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-600">
                Total Marks
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                {totalMarks}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-600">
                Material
              </p>
              <p className="mt-1 truncate text-sm font-medium text-white">
                {file ? file.name : "Topic based"}
              </p>
            </div>

          </div>

          {/* QUESTIONS */}
          <div className="space-y-4">

            <div className="flex items-center gap-2">
              <BookOpen
                size={18}
                className="text-slate-400"
              />

              <h2 className="text-sm font-semibold text-white">
                Questions + Answers
              </h2>
            </div>

            {questions.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6"
              >
                <div className="flex items-start gap-4">

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-semibold text-slate-300">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-slate-500">
                        {item.type}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-slate-500">
                        {marks} Marks
                      </span>
                    </div>

                    <h3 className="mt-3 text-sm font-semibold leading-6 text-white">
                      {item.question}
                    </h3>

                    <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Check
                          size={14}
                          className="text-slate-500"
                        />

                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                          Reference Answer
                        </span>
                      </div>

                      <p className="text-sm leading-6 text-slate-400">
                        {item.answer}
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            ))}

          </div>

          {/* FOOTER NOTICE */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <Sparkles
              size={16}
              className="mt-0.5 shrink-0 text-slate-600"
            />

            <div>
              <p className="text-xs font-medium text-slate-500">
                AI Answer Key
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-700">
                These are frontend demo questions. Gemma will
                generate questions and reference answers after backend
                integration.
              </p>
            </div>
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
              <FileText
                size={21}
                className="text-white"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Test Paper
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Generate short and long answer questions with reference answers.
              </p>
            </div>

          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_390px]">

          {/* CONFIGURATION */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">

            <div className="mb-6">
              <h2 className="text-sm font-semibold text-white">
                Paper Configuration
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                Configure the type and size of your test paper.
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
                  onChange={(event) =>
                    setSubject(event.target.value)
                  }
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
                  onChange={(event) =>
                    setTopic(event.target.value)
                  }
                  placeholder="e.g. Transactions"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-white/20 focus:bg-white/[0.05]"
                />
              </div>

              {/* QUESTION TYPE */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-500">
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
                      className={`rounded-xl border px-3 py-3 text-xs transition ${
                        questionType === type
                          ? "border-white/20 bg-white/[0.08] text-white ring-1 ring-white/10"
                          : "border-white/10 bg-white/[0.02] text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* MARKS */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Marks per Question
                </label>

                <select
                  value={marks}
                  onChange={(event) =>
                    setMarks(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0b0f18] px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                >
                  {marksOptions.map((mark) => (
                    <option key={mark} value={mark}>
                      {mark} {mark === 1 ? "Mark" : "Marks"}
                    </option>
                  ))}
                </select>
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
                      onClick={() =>
                        setQuestionCount(count)
                      }
                      className={`rounded-xl border py-3 text-xs transition ${
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

            </div>

            {/* SUMMARY */}
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  Total Marks
                </span>

                <span className="text-lg font-semibold text-white">
                  {totalMarks}
                </span>
              </div>

              <div className="mt-3 h-px bg-white/10" />

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  {questionCount} questions × {marks} marks
                </span>

                <span className="text-slate-500">
                  {questionType}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={generatePaper}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-slate-200"
            >
              <Zap size={17} />
              Generate Answer Key
            </button>

          </div>

          {/* UPLOAD */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">

            <div className="mb-5">
              <h2 className="text-sm font-semibold text-white">
                Study Material
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                Upload notes or study material to generate relevant questions.
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
                  <Upload
                    size={21}
                    className="text-slate-400"
                  />
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

            {/* INFO */}
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">

              <div className="flex items-start gap-3">

                <Sparkles
                  size={16}
                  className="mt-0.5 shrink-0 text-slate-600"
                />

                <div>
                  <p className="text-xs font-medium text-slate-500">
                    How it works
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-700">
                    Upload your material or enter a topic. Gemma will
                    later generate questions and reference answers
                    based on your selected configuration.
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

export default TestPaper;