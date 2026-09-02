import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const FileContext = createContext(null);

const STORAGE_KEY = "offsedu_file_state";

const MAX_FILES = 50;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export const FILE_STATUS = {
  SELECTED: "selected",
  VALIDATING: "validating",
  UPLOADING: "uploading",
  PROCESSING: "processing",
  READY: "ready",
  ERROR: "error",
  UNAVAILABLE: "unavailable",
};

export const SUPPORTED_FILE_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".pptx",
  ".txt",
  ".md",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".bmp",
  ".gif",
  ".tiff",
  ".tif",
];

const getFileExtension = (fileName = "") => {
  const lastDot = fileName.lastIndexOf(".");

  if (lastDot === -1) {
    return "";
  }

  return fileName.slice(lastDot).toLowerCase();
};

const generateId = (prefix = "file") => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const getFileFingerprint = (file) => {
  if (!file) {
    return "";
  }

  return [
    file.name,
    file.size,
    file.lastModified || 0,
    file.type || "",
  ].join("|");
};

/**
 * Validate a browser File.
 *
 * Backend validation remains authoritative.
 */
const validateBrowserFile = (file) => {
  if (!file) {
    return {
      valid: false,
      error: "No file selected.",
    };
  }

  if (!file.name) {
    return {
      valid: false,
      error: "File name is missing.",
    };
  }

  if (file.size <= 0) {
    return {
      valid: false,
      error: "The selected file is empty.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "File size exceeds the 50 MB limit.",
    };
  }

  const extension = getFileExtension(file.name);

  if (
    !SUPPORTED_FILE_EXTENSIONS.includes(
      extension
    )
  ) {
    return {
      valid: false,
      error: `Unsupported file type: ${
        extension || "unknown"
      }`,
    };
  }

  return {
    valid: true,
    extension,
  };
};

/**
 * Create normalized frontend file state.
 */
const createFileState = (file) => {
  const validation =
    validateBrowserFile(file);

  const now =
    new Date().toISOString();

  return {
    id: generateId("file"),

    // Browser File object.
    // Never persisted to localStorage.
    originalFile: file,

    name: file?.name || "Unknown file",
    size: file?.size || 0,
    type:
      file?.type ||
      "application/octet-stream",
    extension:
      validation.extension ||
      getFileExtension(file?.name),

    fingerprint:
      getFileFingerprint(file),

    status: validation.valid
      ? FILE_STATUS.SELECTED
      : FILE_STATUS.ERROR,

    progress: 0,

    documentId: null,

    error: validation.valid
      ? null
      : validation.error,

    metadata: {},

    uploadedAt: null,
    processedAt: null,

    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Convert persisted metadata into a safe
 * post-refresh state.
 *
 * The actual browser File object no longer
 * exists after a page refresh.
 */
const restorePersistedFile = (file) => {
  if (!file || typeof file !== "object") {
    return null;
  }

  const status =
    file.status === FILE_STATUS.READY &&
    file.documentId
      ? FILE_STATUS.READY
      : FILE_STATUS.UNAVAILABLE;

  return {
    ...file,

    originalFile: null,

    status,

    progress:
      status === FILE_STATUS.READY
        ? 100
        : 0,

    error:
      status === FILE_STATUS.READY
        ? null
        : "Original file is unavailable. Please select the file again.",

    updatedAt:
      file.updatedAt ||
      new Date().toISOString(),
  };
};

/**
 * Load persisted file metadata.
 */
const loadStoredState = () => {
  try {
    const stored =
      localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return {
        files: [],
        selectedFileId: null,
      };
    }

    const parsed = JSON.parse(stored);

    if (
      !parsed ||
      typeof parsed !== "object"
    ) {
      throw new Error(
        "Invalid file state."
      );
    }

    const files = Array.isArray(
      parsed.files
    )
      ? parsed.files
          .map(restorePersistedFile)
          .filter(Boolean)
          .slice(0, MAX_FILES)
      : [];

    const selectedFileId =
      typeof parsed.selectedFileId ===
      "string"
        ? parsed.selectedFileId
        : null;

    return {
      files,
      selectedFileId,
    };
  } catch {
    return {
      files: [],
      selectedFileId: null,
    };
  }
};

/**
 * Remove raw browser File objects before
 * saving to localStorage.
 */
const serializeFiles = (files) => {
  return files.map((file) => {
    const {
      originalFile,
      ...metadata
    } = file;

    return metadata;
  });
};

export const FileProvider = ({
  children,
}) => {
  const initialState = useMemo(
    () => loadStoredState(),
    []
  );

  const [files, setFiles] =
    useState(initialState.files);

  const [
    selectedFileId,
    setSelectedFileId,
  ] = useState(
    initialState.selectedFileId
  );

  const [error, setErrorState] =
    useState(null);

  /**
   * Persist metadata only.
   */
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          files: serializeFiles(files),
          selectedFileId,
        })
      );
    } catch {
      // Storage failure should not break the application.
    }
  }, [files, selectedFileId]);

  /**
   * Keep selectedFileId valid.
   */
  useEffect(() => {
    if (
      selectedFileId &&
      !files.some(
        (file) =>
          file.id === selectedFileId
      )
    ) {
      setSelectedFileId(null);
    }
  }, [files, selectedFileId]);

  /**
   * Selected file.
   */
  const selectedFile = useMemo(() => {
    return (
      files.find(
        (file) =>
          file.id === selectedFileId
      ) || null
    );
  }, [files, selectedFileId]);

  /**
   * Uploading files.
   */
  const uploadingFiles = useMemo(
    () =>
      files.filter(
        (file) =>
          file.status ===
          FILE_STATUS.UPLOADING
      ),
    [files]
  );

  /**
   * Processing files.
   */
  const processingFiles = useMemo(
    () =>
      files.filter(
        (file) =>
          file.status ===
          FILE_STATUS.PROCESSING
      ),
    [files]
  );

  /**
   * Ready files.
   */
  const readyFiles = useMemo(
    () =>
      files.filter(
        (file) =>
          file.status ===
          FILE_STATUS.READY
      ),
    [files]
  );

  /**
   * Whether any file is currently uploading.
   */
  const isUploading =
    uploadingFiles.length > 0;

  /**
   * Add one or multiple browser files.
   */
  const addFile = useCallback(
    (input) => {
      const incomingFiles = Array.isArray(
        input
      )
        ? input
        : [input];

      const addedFiles = [];
      const errors = [];

      setFiles((previous) => {
        const next = [...previous];

        for (const browserFile of incomingFiles) {
          if (next.length >= MAX_FILES) {
            errors.push(
              `Maximum of ${MAX_FILES} files can be selected.`
            );
            break;
          }

          const validation =
            validateBrowserFile(
              browserFile
            );

          if (!validation.valid) {
            errors.push(
              `${browserFile?.name || "File"}: ${
                validation.error
              }`
            );
            continue;
          }

          const fingerprint =
            getFileFingerprint(
              browserFile
            );

          const duplicate = next.some(
            (existingFile) =>
              existingFile.fingerprint ===
              fingerprint
          );

          if (duplicate) {
            errors.push(
              `${browserFile.name} is already selected.`
            );
            continue;
          }

          const newFile =
            createFileState(
              browserFile
            );

          next.push(newFile);
          addedFiles.push(newFile);
        }

        return next.slice(-MAX_FILES);
      });

      if (errors.length > 0) {
        setErrorState(
          errors.join(" ")
        );
      } else {
        setErrorState(null);
      }

      return addedFiles;
    },
    []
  );

  /**
   * Update an existing file.
   */
  const updateFile = useCallback(
    (fileId, updates = {}) => {
      if (!fileId) {
        return false;
      }

      let updated = false;

      setFiles((previous) =>
        previous.map((file) => {
          if (file.id !== fileId) {
            return file;
          }

          updated = true;

          return {
            ...file,
            ...updates,
            updatedAt:
              new Date().toISOString(),
          };
        })
      );

      return updated;
    },
    []
  );

  /**
   * Set file status.
   */
  const setFileStatus = useCallback(
    (
      fileId,
      status,
      fileError = null
    ) => {
      if (
        !Object.values(
          FILE_STATUS
        ).includes(status)
      ) {
        setErrorState(
          `Invalid file status: ${status}`
        );
        return false;
      }

      return updateFile(fileId, {
        status,
        error: fileError,
      });
    },
    [updateFile]
  );

  /**
   * Set upload progress.
   */
  const setUploadProgress =
    useCallback(
      (fileId, progress) => {
        const numericProgress =
          Number(progress);

        const safeProgress =
          Number.isFinite(
            numericProgress
          )
            ? Math.max(
                0,
                Math.min(
                  100,
                  numericProgress
                )
              )
            : 0;

        return updateFile(fileId, {
          progress: safeProgress,
        });
      },
      [updateFile]
    );

  /**
   * Mark file as uploading.
   */
  const setUploading = useCallback(
    (fileId, progress = 0) => {
      return updateFile(fileId, {
        status:
          FILE_STATUS.UPLOADING,
        progress: Math.max(
          0,
          Math.min(
            100,
            Number(progress) || 0
          )
        ),
        error: null,
      });
    },
    [updateFile]
  );

  /**
   * Mark file as processing.
   */
  const setProcessing =
    useCallback(
      (fileId) => {
        return updateFile(fileId, {
          status:
            FILE_STATUS.PROCESSING,
          progress: 100,
          error: null,
          uploadedAt:
            new Date().toISOString(),
        });
      },
      [updateFile]
    );

  /**
   * Mark processing as completed.
   */
  const markReady = useCallback(
    (
      fileId,
      documentId = null,
      metadata = {}
    ) => {
      if (!documentId) {
        setErrorState(
          "A document ID is required to mark a file as ready."
        );
        return false;
      }

      return updateFile(fileId, {
        status: FILE_STATUS.READY,
        progress: 100,
        documentId,
        metadata:
          metadata &&
          typeof metadata === "object"
            ? metadata
            : {},
        error: null,
        processedAt:
          new Date().toISOString(),
      });
    },
    [updateFile]
  );

  /**
   * Mark file as failed.
   */
  const markError = useCallback(
    (fileId, message) => {
      return updateFile(fileId, {
        status: FILE_STATUS.ERROR,
        error:
          message instanceof Error
            ? message.message
            : String(
                message ||
                  "File processing failed."
              ),
      });
    },
    [updateFile]
  );

  /**
   * Retry a file while the original browser
   * File object is still available.
   */
  const retryFile = useCallback(
    (fileId) => {
      const file = files.find(
        (item) => item.id === fileId
      );

      if (!file) {
        setErrorState(
          "File not found."
        );
        return false;
      }

      if (!file.originalFile) {
        setErrorState(
          "The original file is unavailable. Please select the file again."
        );

        return false;
      }

      const validation =
        validateBrowserFile(
          file.originalFile
        );

      if (!validation.valid) {
        setErrorState(
          validation.error
        );

        return false;
      }

      return updateFile(fileId, {
        status:
          FILE_STATUS.SELECTED,
        progress: 0,
        documentId: null,
        error: null,
        uploadedAt: null,
        processedAt: null,
      });
    },
    [files, updateFile]
  );

  /**
   * Replace an unavailable persisted file
   * with a newly selected browser File.
   */
  const replaceFile = useCallback(
    (fileId, browserFile) => {
      if (!fileId || !browserFile) {
        setErrorState(
          "File replacement failed."
        );
        return false;
      }

      const validation =
        validateBrowserFile(
          browserFile
        );

      if (!validation.valid) {
        setErrorState(
          validation.error
        );
        return false;
      }

      return updateFile(fileId, {
        originalFile: browserFile,
        name: browserFile.name,
        size: browserFile.size,
        type:
          browserFile.type ||
          "application/octet-stream",
        extension:
          validation.extension ||
          getFileExtension(
            browserFile.name
          ),
        fingerprint:
          getFileFingerprint(
            browserFile
          ),
        status:
          FILE_STATUS.SELECTED,
        progress: 0,
        documentId: null,
        error: null,
        uploadedAt: null,
        processedAt: null,
        metadata: {},
      });
    },
    [updateFile]
  );

  /**
   * Select a file.
   */
  const selectFile = useCallback(
    (fileId) => {
      const file = files.find(
        (item) => item.id === fileId
      );

      if (!file) {
        setErrorState(
          "File not found."
        );
        return false;
      }

      setSelectedFileId(fileId);
      setErrorState(null);

      return true;
    },
    [files]
  );

  /**
   * Remove one file.
   */
  const removeFile = useCallback(
    (fileId) => {
      const exists = files.some(
        (file) => file.id === fileId
      );

      if (!exists) {
        setErrorState(
          "File not found."
        );
        return false;
      }

      setFiles((previous) =>
        previous.filter(
          (file) => file.id !== fileId
        )
      );

      if (
        selectedFileId === fileId
      ) {
        setSelectedFileId(null);
      }

      return true;
    },
    [files, selectedFileId]
  );

  /**
   * Clear all files.
   */
  const clearFiles = useCallback(() => {
    setFiles([]);
    setSelectedFileId(null);
    setErrorState(null);

    try {
      localStorage.removeItem(
        STORAGE_KEY
      );
    } catch {
      // Ignore storage errors.
    }
  }, []);

  /**
   * Find a file.
   */
  const getFile = useCallback(
    (fileId) => {
      return (
        files.find(
          (file) => file.id === fileId
        ) || null
      );
    },
    [files]
  );

  /**
   * Find files by status.
   */
  const getFilesByStatus =
    useCallback(
      (status) => {
        return files.filter(
          (file) =>
            file.status === status
        );
      },
      [files]
    );

  /**
   * Set global error.
   */
  const setError = useCallback(
    (value) => {
      if (!value) {
        setErrorState(null);
        return;
      }

      if (value instanceof Error) {
        setErrorState(value.message);
        return;
      }

      setErrorState(String(value));
    },
    []
  );

  /**
   * Clear global error.
   */
  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  /**
   * Context value.
   */
  const value = useMemo(
    () => ({
      // State
      files,
      selectedFileId,
      selectedFile,
      isUploading,
      error,

      // Derived state
      uploadingFiles,
      processingFiles,
      readyFiles,

      // File operations
      addFile,
      updateFile,
      removeFile,
      selectFile,
      clearFiles,
      replaceFile,

      // Lifecycle
      setFileStatus,
      setUploading,
      setUploadProgress,
      setProcessing,
      markReady,
      markError,
      retryFile,

      // Utilities
      getFile,
      getFilesByStatus,

      // Error handling
      setError,
      clearError,

      // Constants
      fileStatus: FILE_STATUS,
      supportedExtensions:
        SUPPORTED_FILE_EXTENSIONS,
      maxFileSize: MAX_FILE_SIZE,
      maxFiles: MAX_FILES,
    }),
    [
      files,
      selectedFileId,
      selectedFile,
      isUploading,
      error,
      uploadingFiles,
      processingFiles,
      readyFiles,
      addFile,
      updateFile,
      removeFile,
      selectFile,
      clearFiles,
      replaceFile,
      setFileStatus,
      setUploading,
      setUploadProgress,
      setProcessing,
      markReady,
      markError,
      retryFile,
      getFile,
      getFilesByStatus,
      setError,
      clearError,
    ]
  );

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
};

/**
 * Access FileContext.
 */
export const useFile = () => {
  const context =
    useContext(FileContext);

  if (!context) {
    throw new Error(
      "useFile must be used inside a FileProvider."
    );
  }

  return context;
};

export default FileContext;
