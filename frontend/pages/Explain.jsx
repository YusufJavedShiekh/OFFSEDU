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
  X,
} from "lucide-react";
import { useRef, useState } from "react";

import { useApp } from "../context/AppContext";

import {
  explainTopic as explainTopicService,
  explainTopicStream,
} from "../services/explanationService";

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
  const {
    explainState,
    updateExplainState,
    clearExplainState,
  } = useApp();

  /*
   * ---------------------------------------------------------
   * Persistent Explain state
   * ---------------------------------------------------------
   */

  const subject = explainState.subject || "";
  const topic = explainState.topic || "";
  const language = explainState.language || "English";
  const level = explainState.level || "Simple";

  const file = explainState.file || null;
  const documentId = explainState.documentId || null;
  const explanation = explainState.explanation || "";

  /*
   * ---------------------------------------------------------
   * Local UI state
   * ---------------------------------------------------------
   */

  const [isDragging, setIsDragging] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const fileInputRef = useRef(null);

  /*
   * ---------------------------------------------------------
   * Explain state setters
   * ---------------------------------------------------------
   */

  const setSubject = (value) => {
    updateExplainState({
      subject:
        typeof value === "function"
          ? value(subject)
          : value,
    });
  };

  const setTopic = (value) => {
    updateExplainState({
      topic:
        typeof value === "function"
          ? value(topic)
          : value,
    });
  };

  const setLanguage = (value) => {
    updateExplainState({
      language:
        typeof value === "function"
          ? value(language)
          : value,
    });
  };

  const setLevel = (value) => {
    updateExplainState({
      level:
        typeof value === "function"
          ? value(level)
          : value,
    });
  };

  const setFile = (value) => {
    updateExplainState({
      file:
        typeof value === "function"
          ? value(file)
          : value,
    });
  };

  const setDocumentId = (value) => {
    updateExplainState({
      documentId:
        typeof value === "function"
          ? value(documentId)
          : value,
    });
  };

  const setExplanation = (value) => {
    updateExplainState({
      explanation:
        typeof value === "function"
          ? value(explanation)
          : value,
    });
  };

  /*
   * ---------------------------------------------------------
   * File handling
   * ---------------------------------------------------------
   */

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
        "Please upload PDF, DOCX, TXT, JPG, JPEG or PNG files."
      );
      return;
    }

    /*
     * Store the File object for the current application session.
     *
     * The File object itself cannot be restored from localStorage,
     * but the processed documentId and explanation are persisted
     * by AppContext.
     */
    setFile(selectedFile);

    /*
     * New file means a new backend document ID is required.
     */
    setDocumentId(null);

    setStatusMessage("");

    /*
     * If subject is empty, use the filename as the subject.
     */
    if (!subject.trim()) {
      const filename = selectedFile.name.replace(
        /\.[^/.]+$/,
        ""
      );

      setSubject(filename);
    }
  };

  const handleFileChange = (event) => {
    const selectedFile =
      event.target.files?.[0];

    handleFile(selectedFile);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    setIsDragging(false);

    const droppedFile =
      event.dataTransfer.files?.[0];

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

    setStatusMessage("");
  };

  /*
   * ---------------------------------------------------------
   * Generate explanation
   * ---------------------------------------------------------
   */

  const explainTopic = async () => {
    const displayTopic =
      topic.trim() ||
      (file ? "ALL" : subject.trim());

    if (!displayTopic && !file) {
      setStatusMessage(
        "Please enter a subject/topic or upload study material first."
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
       * -------------------------------------------------------
       * Upload selected document if it has not been processed.
       * -------------------------------------------------------
       */

      if (file && !selectedDocumentId) {
        setStatusMessage(
          "Uploading and processing your study material..."
        );

        const uploadResult =
          await uploadDocument(file);

        if (
          !uploadResult?.success ||
          !uploadResult?.document_id
        ) {
          throw new Error(
            uploadResult?.error ||
              "Unable to process the study material."
          );
        }

        selectedDocumentId =
          uploadResult.document_id;

        setDocumentId(selectedDocumentId);

        setStatusMessage(
          "Study material processed. Generating explanation..."
        );
      }

      /*
       * -------------------------------------------------------
       * Use streaming explanation when available.
       * -------------------------------------------------------
       *
       * explainTopicStream is expected to return the
       * progressively generated explanation text.
       */

      if (typeof explainTopicStream === "function") {
        let streamedExplanation = "";

        await explainTopicStream({
          topic: displayTopic,
          documentId: selectedDocumentId,
          language,
          level,

          onChunk: (chunk) => {
            if (!chunk) {
              return;
            }

            streamedExplanation += chunk;

            setExplanation(
              streamedExplanation
            );
          },

          onComplete: (result) => {
            if (
              result?.explanation &&
              !streamedExplanation
            ) {
              streamedExplanation =
                result.explanation;

              setExplanation(
                streamedExplanation
              );
            }
          },
        });

        if (!streamedExplanation) {
          /*
           * Fallback to the normal request if the stream
           * completed without returning any text.
           */
          const data =
            await explainTopicService({
              topic: displayTopic,
              documentId: selectedDocumentId,
              language,
              level,
            });

          setExplanation(
            data?.explanation ||
              data?.response ||
              data?.message ||
              "No explanation was returned by the backend."
          );
        }
      } else {
        /*
         * Normal non-streaming fallback.
         */
        const data =
          await explainTopicService({
            topic: displayTopic,
            documentId: selectedDocumentId,
            language,
            level,
          });

        setExplanation(
          data?.explanation ||
            data?.response ||
            data?.message ||
            "No explanation was returned by the backend."
        );
      }

      setStatusMessage("");
    } catch (error) {
      console.error(
        "Explanation error:",
        error
      );

      setStatusMessage(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Unable to generate explanation. Please check the backend."
      );
    } finally {
      setIsExplaining(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * Clear Explain page
   * ---------------------------------------------------------
   */

  const clearAll = () => {
    clearExplainState();

    setStatusMessage("");
    setCopied(false);
    setIsDragging(false);
    setIsExplaining(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /*
   * ---------------------------------------------------------
   * Copy explanation
   * ---------------------------------------------------------
   */

  const copyExplanation = async () => {
    if (!explanation) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        explanation
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setStatusMessage(
        "Unable to copy the explanation."
      );
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-[#05080d] px-4 py-6 text-white sm:px-6 lg:px-8">
      {/* Ambient background */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-cyan-500/[0.07] blur-[140px]" />

        <div className="absolute right-[-120px] top-[20%] h-[480px] w-[480px] rounded-full bg-violet-500/[0.055] blur-[160px]" />

        <div className="absolute bottom-[-180px] left-[35%] h-[420px] w-[420px] rounded-full bg-teal-400/[0.04] blur-[150px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.025),transparent_40%)]" />
      </div>

      {/* Main */}

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="mb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/[0.06] px-3 py-1.5 shadow-[0_0_25px_rgba(34,211,238,0.05)] backdrop-blur-xl">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-cyan-400/10">
                  <BookOpen
                    size={12}
                    className="text-cyan-300"
                  />
                </div>

                <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
                  AI Learning
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                <span className="bg-linear-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-transparent">
                  Explain
                </span>
              </h1>

              <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-400 sm:text-sm">
                Make difficult topics easier to understand with your
                local AI study assistant.
              </p>
            </div>

            <button
              type="button"
              onClick={clearAll}
              className="group flex w-fit items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-2.5 text-[10px] font-medium text-slate-400 shadow-lg backdrop-blur-xl transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white"
            >
              <RotateCcw
                size={13}
                className="transition-transform duration-300 group-hover:-rotate-45"
              />

              Clear All
            </button>
          </div>
        </div>

        {/* TWO COLUMN LAYOUT */}

        <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
          {/* SETTINGS */}

          <section className="relative h-fit overflow-hidden rounded-3xl border border-white/[0.08] bg-[#091118]/80 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.30)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-cyan-400/[0.045] blur-[80px]" />

            <div className="relative">
              {/* Card header */}

              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/15 bg-linear-to-br from-cyan-400/[0.12] to-violet-400/[0.06] shadow-[0_0_30px_rgba(34,211,238,0.06)]">
                  <Languages
                    size={19}
                    className="text-cyan-300"
                  />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Explanation Settings
                  </h2>

                  <p className="mt-1 text-[9px] text-slate-500">
                    Customize how Gemma explains the topic.
                  </p>
                </div>
              </div>

              {/* Subject */}

              <div className="mb-5">
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Subject
                </label>

                <input
                  type="text"
                  value={subject}
                  onChange={(event) =>
                    setSubject(
                      event.target.value
                    )
                  }
                  placeholder="e.g. DBMS"
                  className="w-full rounded-2xl border border-white/[0.08] bg-[#050a0f]/80 px-4 py-3.5 text-xs text-slate-100 shadow-inner outline-none transition-all duration-200 placeholder:text-slate-600 hover:border-white/[0.12] focus:border-cyan-300/30 focus:bg-cyan-400/[0.025] focus:ring-4 focus:ring-cyan-400/[0.035]"
                />
              </div>

              {/* Topic */}

              <div className="mb-5">
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Topic
                </label>

                <textarea
                  value={topic}
                  onChange={(event) =>
                    setTopic(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Normalization and its normal forms"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-white/[0.08] bg-[#050a0f]/80 px-4 py-3.5 text-xs leading-5 text-slate-100 shadow-inner outline-none transition-all duration-200 placeholder:text-slate-600 hover:border-white/[0.12] focus:border-cyan-300/30 focus:bg-cyan-400/[0.025] focus:ring-4 focus:ring-cyan-400/[0.035]"
                />
              </div>

              {/* Language */}

              <div className="mb-5">
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Explanation Language
                </label>

                <div className="relative">
                  <select
                    value={language}
                    onChange={(event) =>
                      setLanguage(
                        event.target.value
                      )
                    }
                    className="w-full appearance-none rounded-2xl border border-white/[0.08] bg-[#050a0f]/80 px-4 py-3.5 text-xs text-slate-200 shadow-inner outline-none transition-all duration-200 hover:border-white/[0.12] focus:border-cyan-300/30 focus:ring-4 focus:ring-cyan-400/[0.035]"
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

                  <Languages
                    size={13}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-600"
                  />
                </div>
              </div>

              {/* Explanation level */}

              <div className="mb-6">
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Explanation Level
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {explanationLevels.map(
                    (item) => {
                      const active =
                        level === item;

                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            setLevel(item)
                          }
                          className={`relative overflow-hidden rounded-2xl border px-2 py-3 text-[9px] font-semibold transition-all duration-200 ${
                            active
                              ? "border-cyan-300/30 bg-linear-to-br from-cyan-400/[0.13] to-violet-400/[0.08] text-cyan-100 shadow-[0_0_25px_rgba(34,211,238,0.06)]"
                              : "border-white/[0.07] bg-white/[0.02] text-slate-500 hover:border-white/[0.13] hover:bg-white/[0.04] hover:text-slate-300"
                          }`}
                        >
                          {active && (
                            <span className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-cyan-300/70 to-transparent" />
                          )}

                          {item}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Upload */}

              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
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
                    className={`group relative flex min-h-[165px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed px-4 py-7 text-center transition-all duration-300 ${
                      isDragging
                        ? "scale-[1.01] border-cyan-300/50 bg-cyan-400/[0.09] shadow-[0_0_35px_rgba(34,211,238,0.10)]"
                        : "border-white/[0.10] bg-[#050a0f]/70 hover:border-cyan-300/25 hover:bg-cyan-400/[0.035]"
                    }`}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-cyan-400/[0.025] via-transparent to-violet-400/[0.025]" />

                    <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-linear-to-br from-cyan-400/[0.10] to-violet-400/[0.06] shadow-[0_0_25px_rgba(34,211,238,0.05)] transition-transform duration-300 group-hover:scale-105">
                      <Upload
                        size={19}
                        className="text-cyan-300"
                      />
                    </div>

                    <p className="relative text-[11px] font-semibold text-slate-200">
                      Drop your file here
                    </p>

                    <p className="relative mt-1 text-[9px] text-slate-500">
                      or click to browse
                    </p>

                    <div className="relative mt-4 flex flex-wrap justify-center gap-1.5">
                      {[
                        "PDF",
                        "DOCX",
                        "TXT",
                        "JPG",
                        "PNG",
                      ].map((type) => (
                        <span
                          key={type}
                          className="rounded-md border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-[7px] font-medium text-slate-600"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </button>
                ) : (
                  <div className="rounded-2xl border border-cyan-300/15 bg-linear-to-br from-cyan-400/[0.055] to-violet-400/[0.025] p-3.5 shadow-[0_0_30px_rgba(34,211,238,0.035)]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-400/[0.07]">
                        {file.type?.startsWith(
                          "image/"
                        ) ? (
                          <Image
                            size={17}
                            className="text-cyan-300"
                          />
                        ) : (
                          <FileText
                            size={17}
                            className="text-cyan-300"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-semibold text-slate-200">
                          {file.name}
                        </p>

                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              documentId
                                ? "bg-emerald-400"
                                : "bg-cyan-400"
                            }`}
                          />

                          <p className="text-[8px] text-slate-500">
                            {documentId
                              ? "Processed and ready"
                              : "Ready for explanation"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={removeFile}
                        className="rounded-xl border border-transparent p-2 text-slate-600 transition-all hover:border-red-300/10 hover:bg-red-400/[0.06] hover:text-red-300"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status */}

              {statusMessage && (
                <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-300/15 bg-amber-400/[0.05] px-3.5 py-3">
                  <AlertCircle
                    size={14}
                    className="mt-0.5 shrink-0 text-amber-300"
                  />

                  <p className="text-[9px] leading-4 text-amber-100/75">
                    {statusMessage}
                  </p>
                </div>
              )}

              {/* Explain */}

              <button
                type="button"
                onClick={explainTopic}
                disabled={isExplaining}
                className="group relative mt-5 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-cyan-300/25 bg-linear-to-r from-cyan-400/[0.13] via-teal-400/[0.10] to-violet-400/[0.11] px-4 py-3.5 text-xs font-semibold text-white shadow-[0_8px_30px_rgba(34,211,238,0.06)] transition-all duration-200 hover:border-cyan-300/40 hover:shadow-[0_8px_35px_rgba(34,211,238,0.10)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="pointer-events-none absolute inset-0 bg-linear-to-r from-transparent via-white/[0.045] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {isExplaining ? (
                  <>
                    <Loader2
                      size={15}
                      className="animate-spin text-cyan-200"
                    />

                    Generating Explanation...
                  </>
                ) : (
                  <>
                    <Play
                      size={15}
                      className="text-cyan-200"
                    />

                    Explain Topic
                  </>
                )}
              </button>

              {/* Privacy */}

              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-white/[0.04] bg-white/[0.015] px-3 py-2.5">
                <Lightbulb
                  size={13}
                  className="mt-0.5 shrink-0 text-cyan-400/70"
                />

                <p className="text-[8px] leading-4 text-slate-600">
                  Your study material is processed by the local
                  AI backend for this explanation.
                </p>
              </div>
            </div>
          </section>

          {/* RESULT */}

          <section className="relative min-h-[560px] overflow-hidden rounded-3xl border border-white/[0.08] bg-[#091118]/80 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.30)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 rounded-full bg-violet-500/[0.045] blur-[100px]" />

            <div className="relative">
              {/* Result header */}

              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-300/15 bg-linear-to-br from-violet-400/[0.10] to-cyan-400/[0.06]">
                    <BookOpen
                      size={19}
                      className="text-violet-200"
                    />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Explanation
                    </h2>

                    <p className="mt-1 text-[9px] text-slate-500">
                      Generated by your local AI study assistant.
                    </p>
                  </div>
                </div>

                {explanation && (
                  <button
                    type="button"
                    onClick={copyExplanation}
                    className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3.5 py-2.5 text-[9px] font-medium text-slate-400 transition-all duration-200 hover:border-cyan-300/20 hover:bg-cyan-400/[0.04] hover:text-cyan-200"
                  >
                    {copied ? (
                      <>
                        <Check
                          size={13}
                          className="text-emerald-300"
                        />

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

              {/* Empty */}

              {!explanation && !isExplaining ? (
                <div className="relative flex min-h-[450px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/[0.05] bg-[#050a0f]/45 text-center">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.035),transparent_50%)]" />

                  <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-300/10 bg-linear-to-br from-cyan-400/[0.07] to-violet-400/[0.05] shadow-[0_0_45px_rgba(34,211,238,0.05)]">
                    <BookOpen
                      size={30}
                      className="text-cyan-300/60"
                    />
                  </div>

                  <h3 className="text-sm font-semibold text-slate-200">
                    Ready to explain
                  </h3>

                  <p className="mt-2 max-w-md text-[10px] leading-5 text-slate-500">
                    Enter a topic or upload study material,
                    choose your preferred explanation style,
                    and let the local AI assistant explain it.
                  </p>

                  <div className="mt-6 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/60" />

                    <span className="text-[8px] text-slate-600">
                      Local AI
                    </span>

                    <span className="mx-1 h-3 w-px bg-white/[0.06]" />

                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400/60" />

                    <span className="text-[8px] text-slate-600">
                      Private
                    </span>
                  </div>
                </div>
              ) : isExplaining ? (
                /* Loading */

                <div className="relative flex min-h-[450px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/[0.08] bg-[#050a0f]/45 text-center">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.045),transparent_50%)]" />

                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/10 bg-cyan-400/[0.035]">
                    <div className="absolute inset-2 rounded-full border border-cyan-300/10" />

                    <Loader2
                      size={28}
                      className="animate-spin text-cyan-300"
                    />
                  </div>

                  <p className="mt-5 text-xs font-semibold text-slate-200">
                    Processing your request...
                  </p>

                  <p className="mt-2 text-[9px] text-slate-500">
                    Your local AI backend is generating the explanation.
                  </p>

                  <div className="mt-5 flex items-center gap-1.5">
                    <span className="h-1 w-8 animate-pulse rounded-full bg-cyan-400/30" />

                    <span className="h-1 w-5 animate-pulse rounded-full bg-cyan-400/20 [animation-delay:150ms]" />

                    <span className="h-1 w-3 animate-pulse rounded-full bg-violet-400/20 [animation-delay:300ms]" />
                  </div>
                </div>
              ) : (
                /* Explanation output */

                <div className="relative min-h-[450px]">
                  {/* Metadata */}

                  <div className="mb-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[9px] text-slate-500">
                      <span>
                        Language:

                        <span className="ml-1.5 font-medium text-cyan-200">
                          {language}
                        </span>
                      </span>

                      <span className="hidden h-3 w-px bg-white/[0.07] sm:block" />

                      <span>
                        Level:

                        <span className="ml-1.5 font-medium text-violet-200">
                          {level}
                        </span>
                      </span>

                      {file && (
                        <>
                          <span className="hidden h-3 w-px bg-white/[0.07] sm:block" />

                          <span className="max-w-full truncate">
                            Material:

                            <span className="ml-1.5 font-medium text-cyan-200">
                              {file.name}
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actual explanation */}

                  <div className="rounded-2xl border border-white/[0.05] bg-[#050a0f]/35 px-5 py-5 shadow-inner sm:px-6 sm:py-6">
                    <div className="whitespace-pre-wrap text-xs leading-7 text-slate-300 sm:text-[13px]">
                      {explanation}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Explain;