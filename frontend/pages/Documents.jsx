import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Download,
  Eye,
  File,
  FileText,
  FolderOpen,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const STORAGE_KEY = "offsedu_subjects";

const formatSize = (bytes) => {
  if (!bytes) return "0 KB";

  const mb = bytes / (1024 * 1024);

  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const getFileIcon = (fileName) => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (["pdf", "docx", "txt"].includes(extension)) {
    return FileText;
  }

  return File;
};

const getExtension = (fileName) => {
  return fileName.split(".").pop()?.toLowerCase();
};

function Documents() {
  const [subjects, setSubjects] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");

  const [previewFile, setPreviewFile] = useState(null);

  const fileInputRef = useRef(null);

  const selectedSubject = subjects.find(
    (subject) => subject.id === selectedSubjectId,
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [subjects, searchTerm]);

  const totalFiles = subjects.reduce(
    (total, subject) => total + subject.files.length,
    0,
  );

  const totalStorage = subjects.reduce(
    (total, subject) =>
      total +
      subject.files.reduce(
        (fileTotal, file) => fileTotal + (file.size || 0),
        0,
      ),
    0,
  );

  // -----------------------------
  // CREATE SUBJECT
  // -----------------------------

  const createSubject = () => {
    const name = subjectName.trim();

    if (!name) return;

    const newSubject = {
      id: Date.now(),
      name,
      createdAt: new Date().toLocaleDateString("en-IN"),
      files: [],
    };

    setSubjects((prev) => [newSubject, ...prev]);

    setSubjectName("");
    setSubjectModalOpen(false);
  };

  // -----------------------------
  // DELETE SUBJECT
  // -----------------------------

  const deleteSubject = (subjectId) => {
    const subject = subjects.find((item) => item.id === subjectId);

    if (!subject) return;

    const confirmed = window.confirm(
      `Delete "${subject.name}" and all its study material?`,
    );

    if (!confirmed) return;

    setSubjects((prev) =>
      prev.filter((subject) => subject.id !== subjectId),
    );

    if (selectedSubjectId === subjectId) {
      setSelectedSubjectId(null);
    }
  };

  // -----------------------------
  // ADD STUDY MATERIAL
  // -----------------------------

  const addStudyMaterial = (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length || !selectedSubject) return;

    const newFiles = files.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type || "unknown",
      uploadedAt: new Date().toLocaleDateString("en-IN"),

      // Temporary frontend-only URL
      previewUrl: URL.createObjectURL(file),
    }));

    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === selectedSubject.id
          ? {
              ...subject,
              files: [...subject.files, ...newFiles],
            }
          : subject,
      ),
    );

    event.target.value = "";
  };

  // -----------------------------
  // DELETE FILE
  // -----------------------------

  const deleteFile = (fileId) => {
    if (!selectedSubject) return;

    const file = selectedSubject.files.find(
      (item) => item.id === fileId,
    );

    if (file?.previewUrl) {
      URL.revokeObjectURL(file.previewUrl);
    }

    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === selectedSubject.id
          ? {
              ...subject,
              files: subject.files.filter(
                (file) => file.id !== fileId,
              ),
            }
          : subject,
      ),
    );

    if (previewFile?.id === fileId) {
      setPreviewFile(null);
    }
  };

  // -----------------------------
  // DOWNLOAD FILE
  // -----------------------------

  const downloadFile = (file) => {
    if (!file.previewUrl) {
      alert(
        "This file is no longer available after refresh. Please upload it again.",
      );
      return;
    }

    const link = document.createElement("a");

    link.href = file.previewUrl;
    link.download = file.name;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -----------------------------
  // CLEAR ALL MATERIAL
  // -----------------------------

  const clearAllMaterials = () => {
    if (!selectedSubject || selectedSubject.files.length === 0) return;

    const confirmed = window.confirm(
      `Remove all study material from "${selectedSubject.name}"?`,
    );

    if (!confirmed) return;

    selectedSubject.files.forEach((file) => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });

    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === selectedSubject.id
          ? {
              ...subject,
              files: [],
            }
          : subject,
      ),
    );

    setPreviewFile(null);
  };

  // -----------------------------
  // OPEN SUBJECT
  // -----------------------------

  if (selectedSubject) {
    return (
      <section className="min-h-[calc(100vh-80px)] p-5 sm:p-8 lg:p-10">
        <div className="mx-auto max-w-6xl">
          {/* BACK */}
          <button
            type="button"
            onClick={() => setSelectedSubjectId(null)}
            className="mb-6 flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={18} />
            Back to Subjects
          </button>

          {/* SUBJECT HEADER */}
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black">
                  <FolderOpen size={26} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-white sm:text-3xl">
                    {selectedSubject.name}
                  </h1>

                  <p className="mt-1 text-sm text-slate-400">
                    {selectedSubject.files.length}{" "}
                    {selectedSubject.files.length === 1
                      ? "study file"
                      : "study files"}
                  </p>
                </div>
              </div>

              {/* ADD STUDY MATERIAL */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-slate-200"
              >
                <Upload size={18} />
                Add Study Material
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
                onChange={addStudyMaterial}
                className="hidden"
              />
            </div>
          </div>

          {/* MATERIAL LIST */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-white">
                  Study Material
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your notes, books, assignments and study files.
                </p>
              </div>

              {selectedSubject.files.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllMaterials}
                  className="text-sm text-red-400 transition hover:text-red-300"
                >
                  Clear All
                </button>
              )}
            </div>

            {selectedSubject.files.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                  <Upload
                    size={27}
                    className="text-slate-500"
                  />
                </div>

                <h3 className="text-lg font-semibold text-white">
                  No study material yet
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Click{" "}
                  <span className="text-slate-300">
                    Add Study Material
                  </span>{" "}
                  above to upload your files.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {selectedSubject.files.map((file) => {
                  const Icon = getFileIcon(file.name);

                  return (
                    <div
                      key={file.id}
                      className="flex flex-col gap-4 p-5 transition hover:bg-white/[0.02] sm:flex-row sm:items-center"
                    >
                      {/* ICON */}
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                        <Icon
                          size={20}
                          className="text-slate-300"
                        />
                      </div>

                      {/* INFO */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {file.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatSize(file.size)} • Uploaded{" "}
                          {file.uploadedAt}
                        </p>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewFile(file)}
                          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                          <Eye size={16} />
                          Open
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadFile(file)}
                          className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                          title="Download"
                        >
                          <Download size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteFile(file.id)}
                          className="rounded-lg border border-white/10 p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI NOTICE */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex gap-3">
              <BookOpen
                size={20}
                className="mt-0.5 shrink-0 text-slate-300"
              />

              <div>
                <h3 className="text-sm font-semibold text-white">
                  AI Study Material
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  These files will later be available for AI
                  explanations, document chat, quizzes and test
                  paper generation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PREVIEW MODAL */}
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f18] shadow-2xl">
              {/* PREVIEW HEADER */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-white">
                    {previewFile.name}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatSize(previewFile.size)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(previewFile)
                    }
                    className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    title="Download"
                  >
                    <Download size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewFile(null)}
                    className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* PREVIEW CONTENT */}
              <div className="flex flex-1 items-center justify-center overflow-auto bg-black/30 p-4">
                {getExtension(previewFile.name) === "pdf" ? (
                  <iframe
                    src={previewFile.previewUrl}
                    title={previewFile.name}
                    className="h-full w-full rounded-lg bg-white"
                  />
                ) : ["jpg", "jpeg", "png"].includes(
                    getExtension(previewFile.name),
                  ) ? (
                  <img
                    src={previewFile.previewUrl}
                    alt={previewFile.name}
                    className="max-h-full max-w-full rounded-lg object-contain"
                  />
                ) : getExtension(previewFile.name) === "txt" ? (
                  <iframe
                    src={previewFile.previewUrl}
                    title={previewFile.name}
                    className="h-full w-full rounded-lg bg-white"
                  />
                ) : (
                  <div className="max-w-md text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                      <FileText
                        size={28}
                        className="text-slate-400"
                      />
                    </div>

                    <h3 className="text-lg font-semibold text-white">
                      Preview not available
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      DOCX files cannot be previewed directly in
                      the browser yet.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        downloadFile(previewFile)
                      }
                      className="mt-5 flex mx-auto items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-slate-200"
                    >
                      <Download size={17} />
                      Download File
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  // -----------------------------
  // SUBJECTS PAGE
  // -----------------------------

  return (
    <section className="min-h-[calc(100vh-80px)] p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Your Library
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Documents
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Organize your study material subject-wise and
              keep everything ready for AI-powered learning.
            </p>
          </div>

          {/* ADD SUBJECT */}
          <button
            type="button"
            onClick={() => setSubjectModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-slate-200"
          >
            <Plus size={18} />
            Add Subject
          </button>
        </div>

        {/* STATS */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-500">
              Subjects
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {subjects.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-500">
              Study Files
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {totalFiles}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-500">
              Total Storage
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {formatSize(totalStorage)}
            </p>
          </div>
        </div>

        {/* SEARCH */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <Search size={18} className="text-slate-500" />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search subjects..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
          />
        </div>

        {/* SUBJECT CARDS */}
        {filteredSubjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03]">
              <BookOpen
                size={27}
                className="text-slate-500"
              />
            </div>

            <h2 className="text-lg font-semibold text-white">
              {subjects.length === 0
                ? "No subjects yet"
                : "No subjects found"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {subjects.length === 0
                ? "Use the Add Subject button above to create your first subject."
                : "Try searching with a different subject name."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredSubjects.map((subject) => (
              <div
                key={subject.id}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.045]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-black">
                    <FolderOpen size={23} />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      deleteSubject(subject.id)
                    }
                    className="rounded-lg p-2 text-slate-600 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                    title="Delete subject"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <h2 className="mt-5 truncate text-lg font-semibold text-white">
                  {subject.name}
                </h2>

                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <span>
                    {subject.files.length}{" "}
                    {subject.files.length === 1
                      ? "file"
                      : "files"}
                  </span>

                  <span>•</span>

                  <span>
                    Created {subject.createdAt}
                  </span>
                </div>

                {/* ONLY OPEN SUBJECT */}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedSubjectId(subject.id)
                  }
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm font-medium text-slate-200 transition hover:bg-white hover:text-black"
                >
                  <FolderOpen size={17} />
                  Open Subject
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD SUBJECT MODAL */}
      {subjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0f18] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Add Subject
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a subject to organize your study
                  material.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSubjectModalOpen(false);
                  setSubjectName("");
                }}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <input
              type="text"
              value={subjectName}
              onChange={(event) =>
                setSubjectName(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  createSubject();
                }
              }}
              autoFocus
              placeholder="e.g. Database Management System"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-white/25"
            />

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubjectModalOpen(false);
                  setSubjectName("");
                }}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createSubject}
                disabled={!subjectName.trim()}
                className="flex-1 rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Create Subject
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Documents;