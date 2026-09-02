import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useFile } from "../context/FileContext";
import * as documentService from "../services/documentService";

const DEFAULT_CONCURRENCY = 3;

const normalizeError = (error) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error?.message) {
    return String(error.message);
  }

  if (error?.error) {
    return String(error.error);
  }

  return "File upload failed.";
};

const isAbortError = (error) => {
  const message =
    error?.message?.toLowerCase?.() || "";

  return (
    error?.name === "AbortError" ||
    error?.code === "ERR_CANCELED" ||
    error?.code === "ECONNABORTED" ||
    message.includes("aborted") ||
    message.includes("canceled") ||
    message.includes("cancelled")
  );
};

const normalizeFilesInput = (input) => {
  if (!input) {
    return [];
  }

  if (
    typeof FileList !== "undefined" &&
    input instanceof FileList
  ) {
    return Array.from(input);
  }

  if (Array.isArray(input)) {
    return input.filter(Boolean);
  }

  if (
    typeof File !== "undefined" &&
    input instanceof File
  ) {
    return [input];
  }

  return [];
};

const extractDocumentId = (response) => {
  if (!response) {
    return null;
  }

  if (typeof response === "string") {
    return response;
  }

  return (
    response.documentId ??
    response.document_id ??
    response.id ??
    response.document?.id ??
    null
  );
};

const extractMetadata = (response) => {
  if (
    !response ||
    typeof response !== "object"
  ) {
    return {};
  }

  return (
    response.metadata ??
    response.document?.metadata ??
    {}
  );
};

const isProcessingComplete = (response) => {
  return (
    response?.processed === true ||
    response?.status === "ready" ||
    response?.status === "completed" ||
    response?.document?.status === "ready" ||
    response?.document?.status === "completed"
  );
};

export const useUpload = ({
  concurrency = DEFAULT_CONCURRENCY,
} = {}) => {
  const {
    files,
    selectedFile,
    addFile,
    removeFile,
    replaceFile,
    setUploading,
    setUploadProgress,
    setProcessing,
    markReady,
    markError,
    retryFile,
    getFile,
    clearError,
    setError,
    fileStatus,
  } = useFile();

  const [activeUploads, setActiveUploads] =
    useState([]);

  const [queuedUploads, setQueuedUploads] =
    useState([]);

  const [isUploading, setIsUploading] =
    useState(false);

  const [uploadError, setUploadError] =
    useState(null);

  const controllersRef = useRef(
    new Map()
  );

  const activeUploadsRef = useRef(
    new Set()
  );

  const queueRef = useRef([]);

  const mountedRef = useRef(true);

  const processingQueueRef = useRef(false);

  const concurrencyRef = useRef(
    Math.max(
      1,
      Math.floor(
        Number(concurrency) ||
          DEFAULT_CONCURRENCY
      )
    )
  );

  useEffect(() => {
    concurrencyRef.current = Math.max(
      1,
      Math.floor(
        Number(concurrency) ||
          DEFAULT_CONCURRENCY
      )
    );
  }, [concurrency]);

  /*
   * Cleanup all active requests when the
   * component using this hook unmounts.
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      controllersRef.current.forEach(
        (controller) => {
          controller.abort();
        }
      );

      controllersRef.current.clear();
      activeUploadsRef.current.clear();
      queueRef.current = [];
      processingQueueRef.current = false;
    };
  }, []);

  /*
   * Keep upload UI state synchronized with
   * the internal queue.
   */
  const syncQueueState = useCallback(() => {
    if (!mountedRef.current) {
      return;
    }

    setActiveUploads(
      Array.from(
        activeUploadsRef.current
      )
    );

    setQueuedUploads([
      ...queueRef.current,
    ]);

    setIsUploading(
      activeUploadsRef.current.size > 0 ||
        queueRef.current.length > 0
    );
  }, []);

  /*
   * Add browser files to FileContext.
   * This does not start uploading.
   */
  const addFiles = useCallback(
    (input) => {
      const browserFiles =
        normalizeFilesInput(input);

      if (browserFiles.length === 0) {
        const message =
          "No valid files were selected.";

        setUploadError(message);
        setError(message);

        return {
          success: false,
          files: [],
          error: message,
        };
      }

      clearError();

      const added =
        addFile(browserFiles) || [];

      if (added.length === 0) {
        const message =
          "No files were added.";

        setUploadError(message);

        return {
          success: false,
          files: [],
          error: message,
        };
      }

      setUploadError(null);

      return {
        success: true,
        files: added,
      };
    },
    [
      addFile,
      clearError,
      setError,
    ]
  );

  /*
   * Resolve the upload API exposed by
   * documentService.js.
   */
  const getUploadFunction =
    useCallback(() => {
      if (
        typeof documentService.uploadDocument ===
        "function"
      ) {
        return documentService.uploadDocument;
      }

      if (
        typeof documentService.uploadFile ===
        "function"
      ) {
        return documentService.uploadFile;
      }

      return null;
    }, []);

  /*
   * Upload one file.
   */
  const uploadFile = useCallback(
    async (
      fileId,
      options = {}
    ) => {
      if (!fileId) {
        return {
          success: false,
          error: "File ID is required.",
        };
      }

      if (
        activeUploadsRef.current.has(
          fileId
        )
      ) {
        return {
          success: false,
          error:
            "This file is already being uploaded.",
        };
      }

      const file = getFile(fileId);

      if (!file) {
        const message =
          "File not found.";

        setUploadError(message);

        return {
          success: false,
          error: message,
        };
      }

      /*
       * Persisted files do not contain the
       * browser File object after refresh.
       */
      if (!file.originalFile) {
        const message =
          "The original file is unavailable. Please select the file again.";

        markError(
          fileId,
          message
        );

        setUploadError(message);

        return {
          success: false,
          error: message,
          unavailable: true,
          fileId,
        };
      }

      /*
       * Avoid unnecessary re-upload.
       */
      if (
        file.status ===
          fileStatus.READY &&
        !options.force
      ) {
        return {
          success: true,
          documentId:
            file.documentId,
          alreadyReady: true,
          fileId,
        };
      }

      const uploadFunction =
        getUploadFunction();

      if (!uploadFunction) {
        const message =
          "documentService does not provide an upload function.";

        markError(
          fileId,
          message
        );

        setUploadError(message);

        return {
          success: false,
          error: message,
          fileId,
        };
      }

      const controller =
        new AbortController();

      controllersRef.current.set(
        fileId,
        controller
      );

      activeUploadsRef.current.add(
        fileId
      );

      queueRef.current =
        queueRef.current.filter(
          (id) => id !== fileId
        );

      syncQueueState();

      clearError();
      setUploadError(null);

      setUploading(
        fileId,
        0
      );

      try {
        const response =
          await uploadFunction(
            file.originalFile,
            {
              ...options,

              signal:
                controller.signal,

              onProgress: (progress) => {
                if (
                  controller.signal
                    .aborted
                ) {
                  return;
                }

                const numericProgress =
                  Number(progress);

                if (
                  !Number.isFinite(
                    numericProgress
                  )
                ) {
                  return;
                }

                const safeProgress =
                  Math.min(
                    100,
                    Math.max(
                      0,
                      numericProgress
                    )
                  );

                setUploadProgress(
                  fileId,
                  safeProgress
                );
              },
            }
          );

        if (
          controller.signal.aborted
        ) {
          throw new DOMException(
            "Upload cancelled.",
            "AbortError"
          );
        }

        const documentId =
          extractDocumentId(
            response
          );

        if (!documentId) {
          throw new Error(
            "Upload completed but no document ID was returned."
          );
        }

        setUploadProgress(
          fileId,
          100
        );

        /*
         * Upload succeeded. The backend may
         * still be processing the document.
         */
        setProcessing(fileId);

        const processingCompleted =
          isProcessingComplete(
            response
          );

        if (
          processingCompleted
        ) {
          markReady(
            fileId,
            documentId,
            extractMetadata(
              response
            )
          );
        }

        return {
          success: true,
          fileId,
          documentId,
          response,
          processing:
            !processingCompleted,
        };
      } catch (error) {
        const cancelled =
          isAbortError(error) ||
          controller.signal.aborted;

        if (cancelled) {
          /*
           * Cancellation is intentionally not
           * converted into ERROR state.
           */
          if (getFile(fileId)) {
            setUploadProgress(
              fileId,
              0
            );
          }

          return {
            success: false,
            cancelled: true,
            fileId,
          };
        }

        const message =
          normalizeError(error);

        markError(
          fileId,
          message
        );

        setUploadError(message);

        return {
          success: false,
          error: message,
          fileId,
        };
      } finally {
        controllersRef.current.delete(
          fileId
        );

        activeUploadsRef.current.delete(
          fileId
        );

        syncQueueState();
      }
    },
    [
      getFile,
      fileStatus,
      markError,
      markReady,
      setUploading,
      setUploadProgress,
      setProcessing,
      getUploadFunction,
      syncQueueState,
      clearError,
    ]
  );

  /*
   * Add a file ID to the upload queue.
   */
  const queueFile = useCallback(
    (fileId) => {
      if (!fileId) {
        return false;
      }

      if (
        activeUploadsRef.current.has(
          fileId
        )
      ) {
        return false;
      }

      if (
        queueRef.current.includes(
          fileId
        )
      ) {
        return false;
      }

      const file = getFile(fileId);

      if (!file) {
        return false;
      }

      if (!file.originalFile) {
        return false;
      }

      if (
        file.status ===
        fileStatus.READY
      ) {
        return false;
      }

      queueRef.current.push(
        fileId
      );

      syncQueueState();

      return true;
    },
    [
      getFile,
      fileStatus,
      syncQueueState,
    ]
  );

  /*
   * Process queued uploads with controlled
   * concurrency.
   */
  const processQueue = useCallback(
    async () => {
      if (
        processingQueueRef.current
      ) {
        return;
      }

      processingQueueRef.current =
        true;

      try {
        while (
          mountedRef.current &&
          activeUploadsRef.current
            .size <
            concurrencyRef.current &&
          queueRef.current.length > 0
        ) {
          const fileId =
            queueRef.current.shift();

          if (!fileId) {
            continue;
          }

          if (
            activeUploadsRef.current.has(
              fileId
            )
          ) {
            continue;
          }

          const file =
            getFile(fileId);

          if (!file) {
            continue;
          }

          if (
            file.status ===
            fileStatus.READY
          ) {
            continue;
          }

          /*
           * Start without blocking the queue
           * on this upload.
           */
          uploadFile(
            fileId
          ).finally(() => {
            if (
              mountedRef.current
            ) {
              syncQueueState();

              /*
               * Continue processing when an
               * upload slot becomes available.
               */
              processQueue();
            }
          });
        }
      } finally {
        processingQueueRef.current =
          false;

        syncQueueState();
      }
    },
    [
      getFile,
      fileStatus,
      uploadFile,
      syncQueueState,
    ]
  );

  /*
   * Upload multiple files.
   */
  const uploadFiles = useCallback(
    async (
      input,
      options = {}
    ) => {
      let fileIds = [];

      /*
       * Browser files were supplied.
       */
      const isBrowserFileInput =
        (
          typeof FileList !==
            "undefined" &&
          input instanceof FileList
        ) ||
        (
          typeof File !==
            "undefined" &&
          input instanceof File
        ) ||
        Array.isArray(input);

      if (
        isBrowserFileInput
      ) {
        /*
         * If the array contains browser
         * File objects, add them first.
         */
        const normalized =
          normalizeFilesInput(
            input
          );

        const containsBrowserFiles =
          normalized.some(
            (item) =>
              typeof File !==
                "undefined" &&
              item instanceof File
          );

        if (
          containsBrowserFiles
        ) {
          const result =
            addFiles(input);

          if (!result.success) {
            return result;
          }

          fileIds =
            result.files.map(
              (file) => file.id
            );
        } else {
          /*
           * Array of existing file IDs.
           */
          fileIds =
            normalized;
        }
      } else if (
        typeof input === "string"
      ) {
        fileIds = [input];
      } else if (!input) {
        /*
         * No input means all currently
         * available files.
         */
        fileIds = files
          .filter(
            (file) =>
              file.originalFile &&
              file.status !==
                fileStatus.READY
          )
          .map(
            (file) => file.id
          );
      }

      fileIds = [
        ...new Set(
          fileIds.filter(Boolean)
        ),
      ];

      if (fileIds.length === 0) {
        const message =
          "No files are available for upload.";

        setUploadError(message);

        return {
          success: false,
          files: [],
          error: message,
        };
      }

      const queued = [];

      for (
        const fileId of fileIds
      ) {
        if (
          queueFile(fileId)
        ) {
          queued.push(fileId);
        }
      }

      if (queued.length === 0) {
        return {
          success: false,
          files: [],
          error:
            "No files could be queued for upload.",
        };
      }

      /*
       * Start processing.
       *
       * We intentionally don't wait for all
       * uploads here. FileContext remains the
       * source of truth for each file's status.
       */
      await processQueue();

      return {
        success: true,
        queued: queued.length,
        fileIds: queued,
        options,
      };
    },
    [
      addFiles,
      files,
      fileStatus,
      queueFile,
      processQueue,
    ]
  );

  /*
   * Upload an existing FileContext file.
   */
  const uploadSingleFile =
    useCallback(
      (
        fileId,
        options = {}
      ) =>
        uploadFile(
          fileId,
          options
        ),
      [uploadFile]
    );

  /*
   * Retry a failed upload.
   */
  const retryUpload = useCallback(
    async (
      fileId,
      options = {}
    ) => {
      const file =
        getFile(fileId);

      if (!file) {
        const message =
          "File not found.";

        setUploadError(message);

        return {
          success: false,
          error: message,
        };
      }

      if (!file.originalFile) {
        const message =
          "The original file is unavailable. Please select the file again.";

        setUploadError(message);

        return {
          success: false,
          error: message,
          unavailable: true,
        };
      }

      if (
        activeUploadsRef.current.has(
          fileId
        )
      ) {
        return {
          success: false,
          error:
            "This file is already being uploaded.",
        };
      }

      const reset =
        retryFile(fileId);

      if (!reset) {
        return {
          success: false,
          error:
            "Unable to reset the file for retry.",
        };
      }

      return uploadFile(
        fileId,
        options
      );
    },
    [
      getFile,
      retryFile,
      uploadFile,
    ]
  );

  /*
   * Replace an unavailable file with a new
   * browser File and upload it.
   */
  const replaceAndUpload =
    useCallback(
      async (
        fileId,
        browserFile,
        options = {}
      ) => {
        if (!browserFile) {
          return {
            success: false,
            error:
              "A replacement file is required.",
          };
        }

        const replaced =
          replaceFile(
            fileId,
            browserFile
          );

        if (!replaced) {
          return {
            success: false,
            error:
              "Unable to replace file.",
          };
        }

        return uploadFile(
          fileId,
          options
        );
      },
      [
        replaceFile,
        uploadFile,
      ]
    );

  /*
   * Cancel one active or queued upload.
   */
  const cancelUpload = useCallback(
    (fileId) => {
      if (!fileId) {
        return false;
      }

      const controller =
        controllersRef.current.get(
          fileId
        );

      if (controller) {
        controller.abort();

        return true;
      }

      const wasQueued =
        queueRef.current.includes(
          fileId
        );

      if (wasQueued) {
        queueRef.current =
          queueRef.current.filter(
            (id) => id !== fileId
          );

        syncQueueState();

        return true;
      }

      return false;
    },
    [syncQueueState]
  );

  /*
   * Cancel everything.
   */
  const cancelAllUploads =
    useCallback(() => {
      controllersRef.current.forEach(
        (controller) => {
          controller.abort();
        }
      );

      controllersRef.current.clear();

      queueRef.current = [];

      syncQueueState();

      return true;
    }, [syncQueueState]);

  /*
   * Remove file from both queue and
   * FileContext.
   */
  const removeUpload = useCallback(
    (fileId) => {
      cancelUpload(fileId);

      return removeFile(fileId);
    },
    [
      cancelUpload,
      removeFile,
    ]
  );

  /*
   * Clear upload-level and FileContext
   * errors.
   */
  const clearUploadError =
    useCallback(() => {
      setUploadError(null);
      clearError();
    }, [clearError]);

  return {
    /*
     * File state
     */
    files,
    selectedFile,

    /*
     * Upload state
     */
    isUploading,
    activeUploads,
    queuedUploads,
    uploadError,

    /*
     * Selection
     */
    addFiles,

    /*
     * Upload
     */
    uploadFile:
      uploadSingleFile,
    uploadFiles,

    /*
     * Retry / replacement
     */
    retryUpload,
    replaceAndUpload,

    /*
     * Cancellation
     */
    cancelUpload,
    cancelAllUploads,

    /*
     * File management
     */
    removeUpload,

    /*
     * Errors
     */
    clearUploadError,

    /*
     * Configuration
     */
    concurrency:
      concurrencyRef.current,
  };
};

export default useUpload;
