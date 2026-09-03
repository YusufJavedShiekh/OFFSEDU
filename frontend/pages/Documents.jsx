import {
  getDocuments,
  uploadDocument,
} from "../services/documentService";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  Download,
  Eye,
  File,
  FileImage,
  FileText,
  FolderOpen,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const STORAGE_KEY = "offsedu_subjects";

const allowedExtensions = [
  ".pdf",
  ".docx",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
];

function getFileExtension(fileName) {
  if (typeof fileName !== "string") {
    return "";
  }

  const lastDot = fileName.lastIndexOf(".");

  return lastDot === -1
    ? ""
    : fileName.slice(lastDot).toLowerCase();
}

function getFileIcon(fileName) {
  const extension = getFileExtension(fileName);

  if ([".jpg", ".jpeg", ".png"].includes(extension)) {
    return FileImage;
  }

  if (
    extension === ".pdf" ||
    extension === ".txt" ||
    extension === ".docx"
  ) {
    return FileText;
  }

  return File;
}

function getFileType(fileName) {
  const extension = getFileExtension(fileName);

  if (extension === ".pdf") return "PDF";
  if (extension === ".docx") return "DOCX";
  if (extension === ".txt") return "TXT";

  if ([".jpg", ".jpeg", ".png"].includes(extension)) {
    return "IMAGE";
  }

  return "FILE";
}

function formatFileSize(bytes) {
  if (!bytes) {
    return "Unknown size";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Documents() {
  const [subjects, setSubjects] = useState([]);
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);

  const [showAddSubject, setShowAddSubject] = useState(false);
  const [subjectName, setSubjectName] = useState("");

  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [previewFile, setPreviewFile] = useState(null);
  const [previewText, setPreviewText] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const fileInputRef = useRef(null);

  /*
   * Load subjects from localStorage
   */
  useEffect(() => {
    try {
      const savedSubjects = localStorage.getItem(STORAGE_KEY);

      if (savedSubjects) {
        const parsed = JSON.parse(savedSubjects);

        if (Array.isArray(parsed)) {
          setSubjects(parsed);
        }
      }
    } catch (error) {
      console.error("Unable to load saved subjects:", error);
      setSubjects([]);
    } finally {
      setSubjectsLoaded(true);
    }
  }, []);

  /*
   * Reconcile locally stored files with backend documents
   */
  useEffect(() => {
    if (!subjectsLoaded) {
      return;
    }

    const loadBackendDocuments = async () => {
      try {
        const result = await getDocuments();

        if (
          !result.success ||
          !Array.isArray(result.documents)
        ) {
          return;
        }

        setSubjects((currentSubjects) =>
          currentSubjects.map((subject) => {
            const files = subject.files || [];
            let filesChanged = false;

            const updatedFiles = files.map((file) => {
              const backendDocument = result.documents.find(
                (document) =>
                  String(document.document_id) ===
                    String(file.id) ||
                  document.stored_filename ===
                    file.storedFilename,
              );

              if (!backendDocument) {
                return file;
              }

              const fileName =
                typeof backendDocument.original_filename ===
                "string"
                  ? backendDocument.original_filename
                  : typeof backendDocument.filename ===
                    "string"
                    ? backendDocument.filename
                    : file.name;

              const updatedFile = {
                ...file,
                id: backendDocument.document_id,
                name: fileName,
                size:
                  backendDocument.file_size ??
                  file.size,
                extension:
                  getFileExtension(fileName) ||
                  file.extension,
                storedFilename:
                  backendDocument.stored_filename ||
                  file.storedFilename,
              };

              const changed =
                updatedFile.id !== file.id ||
                updatedFile.name !== file.name ||
                updatedFile.size !== file.size ||
                updatedFile.extension !== file.extension ||
                updatedFile.storedFilename !==
                  file.storedFilename;

              if (changed) {
                filesChanged = true;
                return updatedFile;
              }

              return file;
            });

            if (!filesChanged) {
              return subject;
            }

            return {
              ...subject,
              files: updatedFiles,
            };
          }),
        );
      } catch (error) {
        console.error(
          "Unable to reconcile backend documents:",
          error,
        );
      }
    };

    loadBackendDocuments();
  }, [subjectsLoaded]);

  /*
   * Save subjects to localStorage
   */
  useEffect(() => {
    if (!subjectsLoaded) {
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(subjects),
      );
    } catch (error) {
      console.error(
        "Unable to save subjects:",
        error,
      );
    }
  }, [subjects, subjectsLoaded]);

  const activeSubject = subjects.find(
    (subject) => subject.id === activeSubjectId,
  );

  const filteredSubjects = subjects.filter((subject) =>
    subject.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  /*
   * Add subject
   */
  const addSubject = () => {
    const trimmedName = subjectName.trim();

    if (!trimmedName) {
      alert("Please enter a subject name.");
      return;
    }

    const newSubject = {
      id: Date.now(),
      name: trimmedName,
      files: [],
    };

    setSubjects((current) => [
      ...current,
      newSubject,
    ]);

    setSubjectName("");
    setShowAddSubject(false);
  };

  /*
   * Delete subject
   */
  const deleteSubject = (subjectId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this subject and its study materials?",
    );

    if (!confirmed) {
      return;
    }

    setSubjects((current) =>
      current.filter(
        (subject) => subject.id !== subjectId,
      ),
    );

    if (activeSubjectId === subjectId) {
      setActiveSubjectId(null);
    }
  };

  /*
   * Open subject
   */
  const openSubject = (subjectId) => {
    setActiveSubjectId(subjectId);
  };

  /*
   * Close subject
   */
  const closeSubject = () => {
    setActiveSubjectId(null);
    setSearchTerm("");
  };

  /*
   * File selection
   */
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const extension = getFileExtension(file.name);

    if (!allowedExtensions.includes(extension)) {
      alert(
        "Unsupported file type. Please upload PDF, DOCX, TXT, JPG, JPEG or PNG.",
      );

      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  /*
   * Upload material
   */
  const uploadMaterial = async () => {
    if (!activeSubjectId) {
      alert("Please open a subject first.");
      return;
    }

    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }

    let result;

    try {
      result = await uploadDocument(selectedFile);

      if (!result.success) {
        throw new Error(
          result.error || "Upload failed.",
        );
      }
    } catch (error) {
      alert(
        error.response?.data?.error ||
          error.message ||
          "Unable to upload the document.",
      );

      return;
    }

    const newFile = {
      id: result.document_id || Date.now(),
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
      extension: getFileExtension(selectedFile.name),
      storedFilename: result.stored_filename,
      uploadedAt: new Date().toISOString(),
    };

    setSubjects((current) =>
      current.map((subject) =>
        subject.id === activeSubjectId
          ? {
              ...subject,
              files: [
                ...(subject.files || []),
                newFile,
              ],
            }
          : subject,
      ),
    );

    setSelectedFile(null);
    setShowUpload(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /*
   * Remove file from subject
   */
  const removeFile = (fileId) => {
    if (!activeSubjectId) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this study material?",
    );

    if (!confirmed) {
      return;
    }

    setSubjects((current) =>
      current.map((subject) =>
        subject.id === activeSubjectId
          ? {
              ...subject,
              files: (subject.files || []).filter(
                (file) => file.id !== fileId,
              ),
            }
          : subject,
      ),
    );

    if (previewFile?.id === fileId) {
      setPreviewFile(null);
      setPreviewText("");
      setPreviewLoading(false);
    }
  };

  /*
   * Get permanent backend file URL
   */
  const getFileUrl = (file) => {
    if (!file?.storedFilename) {
      return null;
    }

    return `http://127.0.0.1:5000/api/documents/file/${encodeURIComponent(
      file.storedFilename,
    )}`;
  };

  /*
   * Download file
   */
  const downloadFile = async (file) => {
    const fileUrl = getFileUrl(file);

    if (!fileUrl) {
      alert("This file is not available.");
      return;
    }

    try {
      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error(
          "Unable to download the file.",
        );
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = file.name || "download";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Unable to download the file.");
    }
  };

  /*
   * Check if file can be previewed
   */
  const canPreview = (file) => {
    if (!file) {
      return false;
    }

    return [
      ".pdf",
      ".jpg",
      ".jpeg",
      ".png",
      ".txt",
    ].includes(file.extension);
  };

  /*
   * Open preview
   */
  const openPreview = async (file) => {
    setPreviewFile(file);
    setPreviewText("");
    setPreviewLoading(false);

    if (file.extension !== ".txt") {
      return;
    }

    const fileUrl = getFileUrl(file);

    if (!fileUrl) {
      setPreviewText(
        "This file is not available.",
      );
      return;
    }

    setPreviewLoading(true);

    try {
      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error(
          "Unable to load preview.",
        );
      }

      const text = await response.text();

      setPreviewText(text);
    } catch (error) {
      console.error(
        "Preview failed:",
        error,
      );

      setPreviewText(
        "Unable to load this file.",
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  /*
   * Close preview
   */
  const closePreview = () => {
    setPreviewFile(null);
    setPreviewText("");
    setPreviewLoading(false);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-gradient-to-br from-[#063b3b] via-[#06272d] to-[#03070b] px-4 py-6 sm:px-6 lg:px-8">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-20 h-[420px] w-[420px] rounded-full bg-teal-500/10 blur-3xl" />

        <div className="absolute right-[-120px] top-1/4 h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="absolute bottom-[-180px] left-1/3 h-[420px] w-[420px] rounded-full bg-teal-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {!activeSubject ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-300/20 bg-teal-400/10 text-teal-300">
                      <FolderOpen size={22} />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-teal-300">
                        Your Study Library
                      </p>

                      <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                        Documents
                      </h1>
                    </div>
                  </div>

                  <p className="max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                    Organize your study materials
                    subject-wise and keep all your
                    learning files in one place.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowAddSubject(true)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500/90 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 active:scale-[0.99]"
                >
                  <Plus size={18} />
                  Add Subject
                </button>
              </div>
            </div>

            {/* Search */}
            {subjects.length > 0 && (
              <div className="mb-6">
                <div className="relative max-w-xl">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(
                        event.target.value,
                      )
                    }
                    placeholder="Search subjects..."
                    className="w-full rounded-2xl border border-white/10 bg-[#061214]/65 py-3.5 pl-11 pr-4 text-sm text-white outline-none backdrop-blur-xl transition placeholder:text-slate-600 focus:border-teal-400/30"
                  />
                </div>
              </div>
            )}

            {/* Subjects */}
            {subjects.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-[#061214]/65 px-6 py-16 text-center shadow-2xl shadow-black/20 backdrop-blur-xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-300/15 bg-teal-400/10 text-teal-300">
                  <BookOpen size={28} />
                </div>

                <h2 className="mt-5 text-xl font-semibold text-white">
                  No subjects yet
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Add a subject to start organizing
                  your PDFs, documents, notes and
                  images.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setShowAddSubject(true)
                  }
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border border-teal-300/20 bg-teal-400/10 px-5 py-3 text-sm font-medium text-teal-300 transition hover:bg-teal-400/15"
                >
                  <Plus size={17} />
                  Add Your First Subject
                </button>
              </div>
            ) : filteredSubjects.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-[#061214]/65 px-6 py-14 text-center backdrop-blur-xl">
                <Search
                  className="mx-auto text-slate-600"
                  size={30}
                />

                <h2 className="mt-4 font-semibold text-white">
                  No matching subjects
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Try searching with a different
                  subject name.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSubjects.map(
                  (subject) => {
                    const fileCount =
                      subject.files?.length || 0;

                    return (
                      <div
                        key={subject.id}
                        className="group relative rounded-3xl border border-white/10 bg-[#061214]/65 p-5 shadow-xl shadow-black/10 backdrop-blur-xl transition hover:border-teal-300/20 hover:bg-[#071719]/80"
                      >
                        <div className="flex items-start justify-between">
                          <button
                            type="button"
                            onClick={() =>
                              openSubject(
                                subject.id,
                              )
                            }
                            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-300/15 bg-teal-400/10 text-teal-300 transition group-hover:bg-teal-400/15"
                          >
                            <BookOpen size={23} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteSubject(
                                subject.id,
                              )
                            }
                            aria-label={`Delete ${subject.name}`}
                            className="rounded-lg p-2 text-slate-600 transition hover:bg-red-500/10 hover:text-red-300"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            openSubject(
                              subject.id,
                            )
                          }
                          className="mt-5 block w-full text-left"
                        >
                          <h2 className="truncate text-lg font-semibold text-white">
                            {subject.name}
                          </h2>

                          <p className="mt-2 text-sm text-slate-500">
                            {fileCount}{" "}
                            {fileCount === 1
                              ? "study material"
                              : "study materials"}
                          </p>
                        </button>

                        <div className="mt-5 border-t border-white/[0.06] pt-4">
                          <button
                            type="button"
                            onClick={() =>
                              openSubject(
                                subject.id,
                              )
                            }
                            className="flex w-full items-center justify-between text-sm text-slate-400 transition hover:text-teal-300"
                          >
                            <span>
                              Open Subject
                            </span>

                            <ChevronLeft
                              className="rotate-180"
                              size={17}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Subject header */}
            <div className="mb-7">
              <button
                type="button"
                onClick={closeSubject}
                className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-teal-300"
              >
                <ChevronLeft size={17} />
                Back to Documents
              </button>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-300/20 bg-teal-400/10 text-teal-300">
                      <BookOpen size={22} />
                    </div>

                    <div>
                      <p className="text-sm text-teal-300">
                        Subject
                      </p>

                      <h1 className="max-w-xl truncate text-2xl font-semibold text-white sm:text-3xl">
                        {activeSubject.name}
                      </h1>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500">
                    {activeSubject.files?.length ||
                      0}{" "}
                    study materials
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowUpload(true)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500/90 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 active:scale-[0.99]"
                >
                  <Upload size={18} />
                  Add Study Material
                </button>
              </div>
            </div>

            {/* Materials */}
            {!activeSubject.files?.length ? (
              <div className="rounded-3xl border border-white/10 bg-[#061214]/65 px-6 py-16 text-center backdrop-blur-xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-300/15 bg-teal-400/10 text-teal-300">
                  <Upload size={27} />
                </div>

                <h2 className="mt-5 text-xl font-semibold text-white">
                  No study materials
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Upload PDFs, Word documents,
                  text files or images for this
                  subject.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setShowUpload(true)
                  }
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border border-teal-300/20 bg-teal-400/10 px-5 py-3 text-sm font-medium text-teal-300 transition hover:bg-teal-400/15"
                >
                  <Plus size={17} />
                  Add Study Material
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {activeSubject.files.map(
                  (file) => {
                    const FileIcon =
                      getFileIcon(file.name);

                    const type =
                      getFileType(file.name);

                    return (
                      <div
                        key={file.id}
                        className="group rounded-2xl border border-white/10 bg-[#061214]/65 p-4 backdrop-blur-xl transition hover:border-teal-300/15 hover:bg-[#071719]/80 sm:p-5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-teal-300">
                            <FileIcon size={22} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-medium text-white">
                              {file.name}
                            </h3>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span>
                                {type}
                              </span>

                              <span>•</span>

                              <span>
                                {formatFileSize(
                                  file.size,
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            {canPreview(file) && (
                              <button
                                type="button"
                                onClick={() =>
                                  openPreview(
                                    file,
                                  )
                                }
                                aria-label={`Preview ${file.name}`}
                                className="rounded-xl p-2.5 text-slate-500 transition hover:bg-teal-400/10 hover:text-teal-300"
                              >
                                <Eye
                                  size={18}
                                />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                downloadFile(
                                  file,
                                )
                              }
                              aria-label={`Download ${file.name}`}
                              className="rounded-xl p-2.5 text-slate-500 transition hover:bg-teal-400/10 hover:text-teal-300"
                            >
                              <Download
                                size={18}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removeFile(
                                  file.id,
                                )
                              }
                              aria-label={`Delete ${file.name}`}
                              className="rounded-xl p-2.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-300"
                            >
                              <Trash2
                                size={18}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#071214] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Add Subject
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Create a new study folder.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAddSubject(false)
                }
                className="rounded-xl p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <label className="mb-2 block text-sm font-medium text-slate-300">
              Subject Name
            </label>

            <input
              autoFocus
              type="text"
              value={subjectName}
              onChange={(event) =>
                setSubjectName(
                  event.target.value,
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  addSubject();
                }
              }}
              placeholder="e.g. Database Management System"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-teal-400/30"
            />

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowAddSubject(false)
                }
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={addSubject}
                className="flex-1 rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
              >
                Add Subject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#071214] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Add Study Material
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Upload material for{" "}
                  {activeSubject?.name}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowUpload(false);
                  setSelectedFile(null);

                  if (fileInputRef.current) {
                    fileInputRef.current.value =
                      "";
                  }
                }}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="w-full rounded-2xl border border-dashed border-teal-300/20 bg-teal-400/[0.04] p-8 text-center transition hover:border-teal-300/35 hover:bg-teal-400/[0.07]"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-400/10 text-teal-300">
                <Upload size={24} />
              </div>

              <p className="mt-4 text-sm font-medium text-white">
                Click to choose a file
              </p>

              <p className="mt-1 text-xs text-slate-500">
                PDF · DOCX · TXT · JPG · JPEG ·
                PNG
              </p>

              {selectedFile && (
                <div className="mx-auto mt-5 max-w-sm truncate rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-teal-300">
                  {selectedFile.name}
                </div>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowUpload(false);
                  setSelectedFile(null);

                  if (fileInputRef.current) {
                    fileInputRef.current.value =
                      "";
                  }
                }}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={uploadMaterial}
                disabled={!selectedFile}
                className="flex-1 rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6">
          <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#071214] shadow-2xl">
            {/* Preview Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-medium text-white">
                  {previewFile.name}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {getFileType(
                    previewFile.name,
                  )}{" "}
                  ·{" "}
                  {formatFileSize(
                    previewFile.size,
                  )}
                </p>
              </div>

              <div className="ml-3 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    downloadFile(
                      previewFile,
                    )
                  }
                  aria-label={`Download ${previewFile.name}`}
                  className="rounded-xl p-2.5 text-slate-400 transition hover:bg-teal-400/10 hover:text-teal-300"
                >
                  <Download size={18} />
                </button>

                <button
                  type="button"
                  onClick={closePreview}
                  aria-label="Close preview"
                  className="rounded-xl p-2.5 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="min-h-0 flex-1 bg-black/20 p-3 sm:p-5">
              {/* Images */}
              {[
                ".jpg",
                ".jpeg",
                ".png",
              ].includes(
                previewFile.extension,
              ) ? (
                <div className="flex h-full items-center justify-center overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4">
                  <img
                    src={getFileUrl(
                      previewFile,
                    )}
                    alt={previewFile.name}
                    className="max-h-full max-w-full rounded-xl object-contain"
                  />
                </div>
              ) : previewFile.extension ===
                ".pdf" ? (
                /* PDF */
                <iframe
                  src={getFileUrl(
                    previewFile,
                  )}
                  title={previewFile.name}
                  className="h-full w-full rounded-2xl border border-white/10 bg-white"
                />
              ) : previewFile.extension ===
                ".txt" ? (
                /* TXT */
                <div className="h-full overflow-auto rounded-2xl border border-white/10 bg-white">
                  <pre className="min-h-full whitespace-pre-wrap break-words p-6 text-sm leading-7 text-black">
                    {previewLoading
                      ? "Loading preview..."
                      : previewText}
                  </pre>
                </div>
              ) : (
                /* DOCX */
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-6 text-center">
                  <FileText
                    size={42}
                    className="text-teal-300"
                  />

                  <h3 className="mt-4 font-semibold text-white">
                    DOCX preview unavailable
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    DOCX files are stored locally
                    for now. Download the file to
                    open it in Microsoft Word or
                    another compatible editor.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(
                        previewFile,
                      )
                    }
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
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
    </div>
  );
}

export default Documents;