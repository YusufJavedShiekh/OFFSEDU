import {
  AlertCircle,
  BookOpen,
  Check,
  Copy,
  FileText,
  Image,
  Languages,
  Lightbulb,
  Loader2,
  Play,
  RotateCcw,
  Upload,
  Volume2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

const languages = [
  "English",
  "Hindi",
  "Marathi",
  "Urdu",
];

const explanationLevels = [
  "Simple",
  "Detailed",
  "Exam Focused",
];

const acceptedExtensions = [
  ".pdf",
  ".docx",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
];

function Explain() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("English");
  const [level, setLevel] = useState("Simple");

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const fileInputRef = useRef(null);

  const handleFile = (selectedFile) => {
    if (!selectedFile) {
      return;
    }

    const extension =
      "." +
      selectedFile.name
        .split(".")
        .pop()
        .toLowerCase();

    if (!acceptedExtensions.includes(extension)) {
      setStatusMessage(
        "Please upload PDF, DOCX, TXT, JPG, JPEG or PNG files.",
      );
      return;
    }

    setFile(selectedFile);
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
    const selectedFile = event.target.files?.[0];

    handleFile(selectedFile);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];

    handleFile(droppedFile);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = () => {
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const explainTopic = () => {
    if (!subject.trim() && !topic.trim() && !file) {
      setStatusMessage(
        "Please enter a subject/topic or upload study material first.",
      );
      return;
    }

    setIsExplaining(true);
    setExplanation("");
    setCopied(false);
    setStatusMessage("");

    setTimeout(() => {
      setExplanation(
        generateExplanation({
          subject,
          topic,
          language,
          level,
          file,
        }),
      );

      setIsExplaining(false);
    }, 1200);
  };

  const clearAll = () => {
    setSubject("");
    setTopic("");
    setLanguage("English");
    setLevel("Simple");
    setFile(null);
    setExplanation("");
    setStatusMessage("");
    setCopied(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const copyExplanation = async () => {
    if (!explanation) {
      return;
    }

    try {
      await navigator.clipboard.writeText(explanation);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setStatusMessage(
        "Unable to copy the explanation.",
      );
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      {/* =========================================================
          EXPLAIN PAGE ATMOSPHERE
      ========================================================== */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Teal Glow */}
        <div
          className="absolute left-[5%] top-[10%] h-[420px] w-[420px] rounded-full blur-[150px]"
          style={{
            background: "rgba(13,148,136,0.07)",
          }}
        />

        {/* Cyan Glow */}
        <div
          className="absolute right-[5%] top-[35%] h-[400px] w-[400px] rounded-full blur-[150px]"
          style={{
            background: "rgba(20,184,166,0.045)",
          }}
        />
      </div>

      {/* =========================================================
          MAIN CONTENT
      ========================================================== */}
      <div className="relative z-10 mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/15 bg-teal-400/[0.045] px-3 py-1.5 backdrop-blur-md">
                <BookOpen
                  size={13}
                  className="text-teal-300"
                />

                <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-teal-200">
                  AI Learning
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Explain
              </h1>

              <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-400 sm:text-sm">
                Make difficult topics easier to understand with your
                local AI study assistant.
              </p>
            </div>

            <button
              type="button"
              onClick={clearAll}
              className="flex w-fit items-center gap-2 rounded-xl border border-white/[0.08] bg-black/25 px-3 py-2 text-[10px] text-slate-400 backdrop-blur-xl transition hover:border-teal-300/15 hover:bg-teal-400/[0.04] hover:text-teal-200"
            >
              <RotateCcw size={13} />
              Clear All
            </button>
          </div>
        </div>

        {/* =========================================================
            TWO COLUMN LAYOUT
        ========================================================== */}
        <div className="grid gap-5 lg:grid-cols-[390px_minmax(0,1fr)]">
          {/* =====================================================
              SETTINGS CARD
          ====================================================== */}
          <section className="h-fit rounded-2xl border border-teal-100/[0.08] bg-[#061214]/72 p-5 shadow-[0_15px_50px_rgba(0,0,0,0.20)] backdrop-blur-2xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-300/15 bg-teal-400/[0.06]">
                <Languages
                  size={18}
                  className="text-teal-300"
                />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-white">
                  Explanation Settings
                </h2>

                <p className="mt-0.5 text-[9px] text-slate-500">
                  Customize how Gemma explains the topic.
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
                className="w-full rounded-xl border border-white/[0.08] bg-black/25 px-3 py-3 text-xs text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-teal-300/25 focus:bg-teal-400/[0.025]"
              />
            </div>

            {/* Topic */}
            <div className="mb-4">
              <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Topic
              </label>

              <textarea
                value={topic}
                onChange={(event) =>
                  setTopic(event.target.value)
                }
                placeholder="e.g. Normalization and its normal forms"
                rows={4}
                className="w-full resize-none rounded-xl border border-white/[0.08] bg-black/25 px-3 py-3 text-xs leading-5 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-teal-300/25 focus:bg-teal-400/[0.025]"
              />
            </div>

            {/* Language */}
            <div className="mb-4">
              <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Explanation Language
              </label>

              <select
                value={language}
                onChange={(event) =>
                  setLanguage(event.target.value)
                }
                className="w-full appearance-none rounded-xl border border-white/[0.08] bg-[#081517] px-3 py-3 text-xs text-slate-200 outline-none transition focus:border-teal-300/25"
              >
                {languages.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Explanation Level */}
            <div className="mb-5">
              <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Explanation Level
              </label>

              <div className="grid grid-cols-3 gap-2">
                {explanationLevels.map((item) => {
                  const active = level === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setLevel(item)}
                      className={`rounded-xl border px-2 py-2.5 text-[9px] font-medium transition ${
                        active
                          ? "border-teal-300/25 bg-teal-400/[0.08] text-teal-200"
                          : "border-white/[0.07] bg-black/20 text-slate-500 hover:border-white/10 hover:text-slate-300"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
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
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
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
                        Ready for explanation
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={removeFile}
                      className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
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

            {/* Explain Button */}
            <button
              type="button"
              onClick={explainTopic}
              disabled={isExplaining}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-teal-300/20 bg-teal-400/[0.08] px-4 py-3 text-xs font-semibold text-teal-100 transition hover:border-teal-300/30 hover:bg-teal-400/[0.13] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExplaining ? (
                <>
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                  Explaining...
                </>
              ) : (
                <>
                  <Play size={14} />
                  Explain with AI
                </>
              )}
            </button>

            {/* Privacy */}
            <div className="mt-4 flex items-start gap-2">
              <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300 shadow-[0_0_8px_rgba(45,212,191,0.6)]" />

              <p className="text-[8px] leading-4 text-slate-500">
                Local-first architecture. Backend and Gemma integration
                will be connected later.
              </p>
            </div>
          </section>

          {/* =====================================================
              EXPLANATION RESULT
          ====================================================== */}
          <section className="flex min-h-[620px] flex-col rounded-2xl border border-teal-100/[0.08] bg-[#061214]/65 shadow-[0_15px_50px_rgba(0,0,0,0.20)] backdrop-blur-2xl">
            {/* Result Header */}
            <div className="flex items-center justify-between border-b border-teal-100/[0.08] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-300/15 bg-teal-400/[0.06]">
                  <Lightbulb
                    size={17}
                    className="text-teal-300"
                  />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    AI Explanation
                  </h2>

                  <p className="mt-0.5 text-[9px] text-slate-500">
                    Your explanation will appear here
                  </p>
                </div>
              </div>

              {explanation && (
                <button
                  type="button"
                  onClick={copyExplanation}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-2 text-[9px] text-slate-400 transition hover:border-teal-300/15 hover:bg-teal-400/[0.04] hover:text-teal-200"
                >
                  {copied ? (
                    <>
                      <Check size={13} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Result Body */}
            <div className="flex-1 overflow-y-auto px-5 py-6">
              {!explanation && !isExplaining ? (
                <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
                  <div className="relative mb-5">
                    <div className="absolute -inset-6 rounded-full bg-teal-400/[0.05] blur-2xl" />

                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-300/15 bg-[#071719]/90">
                      <Lightbulb
                        size={28}
                        strokeWidth={1.5}
                        className="text-teal-200"
                      />
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-200">
                    Ready to explain
                  </h3>

                  <p className="mt-2 max-w-sm text-[10px] leading-5 text-slate-500">
                    Enter a topic or upload study material, choose your
                    preferred language and explanation level, then start.
                  </p>
                </div>
              ) : isExplaining ? (
                <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-300/15 bg-teal-400/[0.06]">
                    <Loader2
                      size={24}
                      className="animate-spin text-teal-300"
                    />
                  </div>

                  <p className="text-sm font-medium text-white">
                    Gemma is preparing your explanation
                  </p>

                  <p className="mt-2 text-[10px] text-slate-500">
                    This is currently a frontend demonstration.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Explanation Meta */}
                  <div className="mb-5 flex flex-wrap gap-2">
                    <MetaBadge label={subject || "General Topic"} />
                    <MetaBadge label={language} />
                    <MetaBadge label={level} />
                  </div>

                  {/* Explanation */}
                  <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-5">
                    <div className="prose prose-invert max-w-none">
                      {explanation.split("\n").map(
                        (paragraph, index) => (
                          <p
                            key={`${paragraph}-${index}`}
                            className="mb-4 whitespace-pre-wrap text-xs leading-7 text-slate-300 last:mb-0"
                          >
                            {paragraph}
                          </p>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Voice */}
                  <div className="mt-5 flex items-center justify-between rounded-xl border border-teal-300/10 bg-teal-400/[0.025] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-400/[0.06]">
                        <Volume2
                          size={15}
                          className="text-teal-300"
                        />
                      </div>

                      <div>
                        <p className="text-[10px] font-medium text-slate-300">
                          Listen to explanation
                        </p>

                        <p className="mt-0.5 text-[8px] text-slate-600">
                          Voice engine will be connected later.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled
                      className="rounded-lg border border-white/[0.06] px-3 py-1.5 text-[8px] text-slate-600"
                    >
                      Coming Soon
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* =========================================================
            FOOTER INFO
        ========================================================== */}
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

function MetaBadge({ label }) {
  return (
    <span className="rounded-lg border border-teal-300/10 bg-teal-400/[0.035] px-2.5 py-1.5 text-[8px] font-medium text-teal-200">
      {label}
    </span>
  );
}

function generateExplanation({
  subject,
  topic,
  language,
  level,
  file,
}) {
  const displayTopic =
    topic.trim() ||
    subject.trim() ||
    file?.name.replace(/\.[^/.]+$/, "") ||
    "this topic";

  if (language === "Hindi") {
    return `Topic: ${displayTopic}

${displayTopic} ko samajhne ke liye sabse pehle iska basic concept samajhna zaroori hai.

Simple explanation:
Ye concept data aur information ko systematically samajhne aur use karne mein help karta hai. Iske important parts ko step-by-step dekhne se topic easily understand ho jata hai.

Important points:
• Basic definition ko clearly samjho.
• Main components aur unke roles identify karo.
• Practical examples ke through concept ko relate karo.
• Exam ke liye definitions aur key points revise karo.

Note:
Abhi ye frontend demonstration hai. Backend ke saath Gemma connect hone ke baad OFFSEDU uploaded material ke basis par actual AI-generated explanation provide karega.`;
  }

  if (language === "Marathi") {
    return `Topic: ${displayTopic}

${displayTopic} समजून घेण्यासाठी प्रथम त्याची मूलभूत संकल्पना समजून घेणे महत्त्वाचे आहे.

Simple explanation:
या संकल्पनेचे मुख्य भाग आणि त्यांचे कार्य step-by-step समजून घेतल्यास विषय अधिक सोपा होतो.

Important points:
• मूलभूत definition समजून घ्या.
• मुख्य components आणि त्यांची भूमिका ओळखा.
• Practical examples शी concept जोडून पहा.
• परीक्षेसाठी महत्त्वाचे points revise करा.

Note:
सध्या हा frontend demonstration आहे. Backend आणि Gemma connect झाल्यानंतर OFFSEDU uploaded study material च्या आधारावर actual AI explanation तयार करेल.`;
  }

  if (language === "Urdu") {
    return `Topic: ${displayTopic}

${displayTopic} کو سمجھنے کے لیے سب سے پہلے اس کے بنیادی تصور کو سمجھنا ضروری ہے۔

Simple explanation:
اس تصور کے اہم حصوں اور ان کے کردار کو step-by-step سمجھنے سے موضوع آسان ہو جاتا ہے۔

Important points:
• بنیادی definition کو سمجھیں۔
• اہم components اور ان کے کردار کو identify کریں۔
• Practical examples کے ساتھ concept کو relate کریں۔
• امتحان کے لیے اہم points revise کریں۔

Note:
فی الحال یہ frontend demonstration ہے۔ Backend اور Gemma connect ہونے کے بعد OFFSEDU uploaded study material کی بنیاد پر actual AI explanation فراہم کرے گا۔`;
  }

  return `Topic: ${displayTopic}

${displayTopic} can be understood more easily by breaking the concept into its basic idea, important components, and practical use.

Simple explanation:
Start with the definition and understand what problem the concept solves. Then identify its main components and understand how they work together. Finally, connect the concept with a practical example.

Important points:
• Understand the basic definition first.
• Identify the main components and their roles.
• Use practical examples to connect theory with real situations.
• For exams, revise definitions, key points and important differences.

Exam tip:
Write the definition first, then explain the main points in a logical order. Adding a small example can make the answer clearer.

Note:
This is currently a frontend demonstration. Once the backend and Gemma are connected, OFFSEDU will generate the actual explanation from your uploaded study material.`;
}

export default Explain;