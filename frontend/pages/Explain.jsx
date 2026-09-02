import { useState } from "react";
import {
  BookOpen,
  Check,
  Copy,
  FileText,
  Image,
  Languages,
  Loader2,
  Mic,
  Sparkles,
  Upload,
  X,
  Zap,
} from "lucide-react";

const languages = ["English", "Hindi", "Marathi", "Urdu"];

const explanationLevels = [
  "Simple",
  "Detailed",
  "Exam Focused",
];

function Explain() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("English");
  const [level, setLevel] = useState("Simple");

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [copied, setCopied] = useState(false);

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

  const generateExplanation = () => {
    if (!file && !topic.trim()) {
      alert("Please upload study material or enter a topic.");
      return;
    }

    setIsGenerating(true);
    setExplanation("");
    setCopied(false);

    setTimeout(() => {
      const title = topic || subject || "Study Material";

      const demoExplanation = `# ${title}

## Easy Explanation

This topic is explained below in a simple and student-friendly way.

### 1. Introduction

${title} is an important concept related to your study material.

The main goal is to understand the concept clearly instead of simply memorizing it.

### 2. Key Concept

The easiest way to understand this topic is to break it into smaller parts.

• First, understand the basic definition.
• Then understand how the concept works.
• Finally, understand its applications and importance.

### 3. Important Points

• Understand the basic definition.
• Learn the main characteristics.
• Understand the working or process.
• Remember important terms.
• Learn practical applications.
• Revise important points before an exam.

### 4. Exam Tip

For exams, start with the definition and then explain the concept using clear points.

If required, add examples, diagrams, advantages, disadvantages or applications.

### 5. Quick Summary

In short, focus on the definition, working, important features and applications of the topic.

---

Explanation Level: ${level}
Language: ${language}
Study Material: ${file ? file.name : "Topic based explanation"}`;

      setExplanation(demoExplanation);
      setIsGenerating(false);
    }, 1500);
  };

  const copyExplanation = async () => {
    if (!explanation) return;

    try {
      await navigator.clipboard.writeText(explanation);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      alert("Unable to copy explanation.");
    }
  };

  const clearAll = () => {
    setSubject("");
    setTopic("");
    setLanguage("English");
    setLevel("Simple");
    setFile(null);
    setExplanation("");
    setCopied(false);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
              <Sparkles size={21} className="text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Explain Study Material
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Let Gemma explain your study material in a way that's easy to understand.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">

          {/* LEFT SIDE */}
          <div className="space-y-5">

            {/* UPLOAD */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Study Material
                  </h2>

                  <p className="mt-1 text-xs text-slate-600">
                    Upload your notes or document
                  </p>
                </div>

                <FileText size={18} className="text-slate-500" />
              </div>

              {!file ? (
                <label
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-5 text-center transition ${
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

                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06]">
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
                      {file.type.startsWith("image/") ? (
                        <Image size={19} className="text-slate-300" />
                      ) : (
                        <FileText size={19} className="text-slate-300" />
                      )}
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
            </div>

            {/* SETTINGS */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

              <h2 className="mb-4 text-sm font-semibold text-white">
                Explanation Settings
              </h2>

              <div className="space-y-4">

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
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-white/20 focus:bg-white/[0.05]"
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
                    placeholder="e.g. Normalization"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-white/20 focus:bg-white/[0.05]"
                  />
                </div>

                {/* LEVEL */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-500">
                    Explanation Level
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    {explanationLevels.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setLevel(item)}
                        className={`rounded-xl border px-2 py-2.5 text-xs transition ${
                          level === item
                            ? "border-white/20 bg-white/[0.08] text-white"
                            : "border-white/10 bg-white/[0.02] text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* LANGUAGE */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Languages size={14} />
                    Explanation Language
                  </label>

                  <select
                    value={language}
                    onChange={(event) =>
                      setLanguage(event.target.value)
                    }
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
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3">

              <button
                type="button"
                onClick={generateExplanation}
                disabled={isGenerating}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap size={17} />
                    Explain with AI
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={clearAll}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 text-slate-500 transition hover:bg-white/[0.07] hover:text-white"
                title="Clear"
              >
                <X size={18} />
              </button>

            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="min-h-[620px] rounded-2xl border border-white/10 bg-white/[0.025]">

            {/* EXPLANATION HEADER */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06]">
                  <BookOpen
                    size={17}
                    className="text-slate-300"
                  />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    AI Explanation
                  </h2>

                  <p className="text-xs text-slate-600">
                    Powered by local Gemma
                  </p>
                </div>

              </div>

              {explanation && (
                <button
                  type="button"
                  onClick={copyExplanation}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
                >
                  {copied ? (
                    <>
                      <Check size={14} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy
                    </>
                  )}
                </button>
              )}

            </div>

            {/* CONTENT */}
            <div className="p-5 sm:p-7">

              {/* EMPTY STATE */}
              {!explanation && !isGenerating && (
                <div className="flex min-h-[510px] flex-col items-center justify-center text-center">

                  <div className="relative mb-5">

                    <div className="absolute inset-0 rounded-2xl bg-white/[0.05] blur-xl" />

                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                      <Sparkles
                        size={27}
                        className="text-slate-400"
                      />
                    </div>

                  </div>

                  <h3 className="text-base font-semibold text-slate-300">
                    Ready to explain
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                    Upload your study material or enter a topic,
                    choose your preferred language and explanation
                    level, then let AI do the rest.
                  </p>

                  <div className="mt-6 flex flex-wrap justify-center gap-2">

                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-600">
                      Simple explanations
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-600">
                      Exam focused
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-600">
                      Multiple languages
                    </span>

                  </div>
                </div>
              )}

              {/* LOADING */}
              {isGenerating && (
                <div className="flex min-h-[510px] flex-col items-center justify-center text-center">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                    <Loader2
                      size={25}
                      className="animate-spin text-slate-300"
                    />
                  </div>

                  <h3 className="mt-5 text-base font-semibold text-white">
                    Gemma is preparing your explanation
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    Analyzing the selected study material...
                  </p>

                </div>
              )}

              {/* RESULT */}
              {explanation && !isGenerating && (
                <>
                  <div className="max-h-[590px] overflow-y-auto pr-2">
                    <div className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
                      {explanation}
                    </div>
                  </div>

                  {/* VOICE PLACEHOLDER */}
                  <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">

                    <div className="flex items-center gap-3">

                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05]">
                        <Mic
                          size={15}
                          className="text-slate-500"
                        />
                      </div>

                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          Listen to explanation
                        </p>

                        <p className="text-[10px] text-slate-700">
                          Voice feature coming soon
                        </p>
                      </div>

                    </div>

                    <button
                      type="button"
                      disabled
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-700"
                    >
                      Listen
                    </button>

                  </div>
                </>
              )}

            </div>
          </div>
        </div>

        {/* AI NOTICE */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">

          <div className="mt-0.5">
            <Sparkles
              size={16}
              className="text-slate-600"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">
              Local AI • Privacy First
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-700">
              Your study material will eventually be processed
              locally through Gemma. Backend integration will be
              connected later.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Explain;