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

import { explainTopic as explainTopicService } from "../services/explanationService";
import { uploadDocument } from "../services/documentService";

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
  const [documentId, setDocumentId] = useState(null);

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

    // New file means a new document ID is required.
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
    setDocumentId(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const explainTopic = async () => {
    const displayTopic =
      topic.trim() ||
      (file
        ? file.name.replace(/\.[^/.]+$/, "")
        : subject.trim());

    if (!displayTopic && !file) {
      setStatusMessage(
        "Please enter a subject/topic or upload study material first.",
      );
      return;
    }

    setIsExplaining(true);
    setExplanation("");
    setCopied(false);
    setStatusMessage("");

    try {
      let selectedDocumentId = documentId;

      /*
       * ---------------------------------------------------------
       * Upload selected document if it has not been uploaded yet.
       * ---------------------------------------------------------
       */
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
          "Study material processed. Generating explanation...",
        );
      }

      /*
       * ---------------------------------------------------------
       * Send topic + document + language + explanation level.
       * ---------------------------------------------------------
       */
      const data = await explainTopicService({
        topic: displayTopic,
        documentId: selectedDocumentId,
        language,
        level,
      });

      setExplanation(
        data?.explanation ||
          data?.response ||
          data?.message ||
          "No explanation was returned by the backend.",
      );

      setStatusMessage("");
    } catch (error) {
      console.error("Explanation error:", error);

      setStatusMessage(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Unable to generate explanation. Please check the backend.",
      );
    } finally {
      setIsExplaining(false);
    }
  };

  const clearAll = () => {
    setSubject("");
    setTopic("");
    setLanguage("English");
    setLevel("Simple");

    setFile(null);
    setDocumentId(null);

    setExplanation("");
    setStatusMessage("");
    setCopied(false);
    setIsDragging(false);

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
        <div
          className="absolute left-[5%] top-[10%] h-[420px] w-[420px] rounded-full blur-[150px]"
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
                        {documentId
                          ? "Processed and ready"
                          : "Ready for explanation"}
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
                  Generating Explanation...
                </>
              ) : (
                <>
                  <Play size={15} />
                  Explain Topic
                </>
              )}
            </button>

            {/* Privacy */}

            <div className="mt-4 flex items-start gap-2">
              <Lightbulb
                size={13}
                className="mt-0.5 shrink-0 text-teal-400/70"
              />

              <p className="text-[8px] leading-4 text-slate-600">
                Your study material is processed by the local
                AI backend for this explanation.
              </p>
            </div>
          </section>

          {/* =====================================================
              RESULT CARD
          ====================================================== */}

          <section className="min-h-[520px] rounded-2xl border border-teal-100/[0.08] bg-[#061214]/72 p-5 shadow-[0_15px_50px_rgba(0,0,0,0.20)] backdrop-blur-2xl">

            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-300/15 bg-teal-400/[0.06]">
                  <BookOpen
                    size={18}
                    className="text-teal-300"
                  />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Explanation
                  </h2>

                  <p className="mt-0.5 text-[9px] text-slate-500">
                    Generated by your local AI study assistant.
                  </p>
                </div>
              </div>

              {explanation && (
                <button
                  type="button"
                  onClick={copyExplanation}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-[9px] text-slate-400 transition hover:border-teal-300/15 hover:text-teal-200"
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

            {!explanation && !isExplaining ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-300/10 bg-teal-400/[0.035]">
                  <BookOpen
                    size={26}
                    className="text-teal-300/60"
                  />
                </div>

                <h3 className="text-sm font-medium text-slate-300">
                  Ready to explain
                </h3>

                <p className="mt-2 max-w-md text-[10px] leading-5 text-slate-600">
                  Enter a topic or upload study material,
                  choose your preferred explanation style,
                  and let the local AI assistant explain it.
                </p>
              </div>
            ) : isExplaining ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                <Loader2
                  size={28}
                  className="animate-spin text-teal-300"
                />

                <p className="mt-4 text-xs font-medium text-slate-300">
                  Processing your request...
                </p>

                <p className="mt-2 text-[9px] text-slate-600">
                  Your local AI backend is generating the explanation.
                </p>
              </div>
            ) : (
              <div className="min-h-[400px]">
                <div className="mb-5 rounded-xl border border-teal-300/10 bg-teal-400/[0.025] px-4 py-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] text-slate-500">
                    <span>
                      Language:
                      <span className="ml-1 text-teal-200">
                        {language}
                      </span>
                    </span>

                    <span>
                      Level:
                      <span className="ml-1 text-teal-200">
                        {level}
                      </span>
                    </span>

                    {file && (
                      <span>
                        Material:
                        <span className="ml-1 text-teal-200">
                          {file.name}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="whitespace-pre-wrap text-xs leading-7 text-slate-300">
                  {explanation}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Explain;