import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import * as voiceService from "../services/voiceService";

const MAX_TTS_LENGTH = 20000;

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

  return "Voice operation failed.";
};

const isAbortError = (error) => {
  const message = error?.message?.toLowerCase?.() || "";

  return (
    error?.name === "AbortError" ||
    error?.code === "ERR_CANCELED" ||
    error?.code === "ECONNABORTED" ||
    message.includes("aborted") ||
    message.includes("cancelled") ||
    message.includes("canceled")
  );
};

const extractTranscript = (response) => {
  if (typeof response === "string") {
    return response.trim();
  }

  const transcript =
    response?.transcript ??
    response?.text ??
    response?.data?.transcript ??
    response?.data?.text ??
    "";

  return String(transcript).trim();
};

const extractAudioSource = (response) => {
  if (!response) {
    return null;
  }

  if (typeof response === "string") {
    return response;
  }

  return (
    response.audioUrl ??
    response.audio_url ??
    response.url ??
    response.audio?.url ??
    response.data?.audioUrl ??
    response.data?.audio_url ??
    response.data?.url ??
    response.audio ??
    response.data?.audio ??
    null
  );
};

const isBlob = (value) => {
  return (
    typeof Blob !== "undefined" &&
    value instanceof Blob
  );
};

const isArrayBuffer = (value) => {
  return (
    typeof ArrayBuffer !== "undefined" &&
    value instanceof ArrayBuffer
  );
};

const blobFromArrayBuffer = (
  value,
  mimeType = "audio/mpeg"
) => {
  if (!isArrayBuffer(value)) {
    return null;
  }

  return new Blob([value], {
    type: mimeType,
  });
};

const createAbortError = (message) => {
  if (typeof DOMException !== "undefined") {
    return new DOMException(message, "AbortError");
  }

  const error = new Error(message);
  error.name = "AbortError";
  return error;
};

export const useVoice = ({
  language = "en",
  autoStopBeforeSpeak = true,
  maxTextLength = MAX_TTS_LENGTH,
} = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [interimTranscript, setInterimTranscript] =
    useState("");
  const [finalTranscript, setFinalTranscript] =
    useState("");

  const [error, setError] = useState(null);
  const [permissionState, setPermissionState] =
    useState("unknown");

  const recognitionRef = useRef(null);
  const recognitionSessionRef = useRef(0);

  const sttControllerRef = useRef(null);
  const ttsControllerRef = useRef(null);

  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);

  const mountedRef = useRef(true);

  const sttOperationIdRef = useRef(0);
  const ttsOperationIdRef = useRef(0);

  const languageRef = useRef(language);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  /*
   * Prevent state updates after unmount and clean
   * every active browser/audio operation.
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      recognitionSessionRef.current += 1;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Recognition may already be stopped.
        }

        recognitionRef.current = null;
      }

      sttOperationIdRef.current += 1;
      ttsOperationIdRef.current += 1;

      sttControllerRef.current?.abort();
      ttsControllerRef.current?.abort();

      sttControllerRef.current = null;
      ttsControllerRef.current = null;

      if (audioRef.current) {
        const audio = audioRef.current;

        audio.onplay = null;
        audio.onpause = null;
        audio.onended = null;
        audio.onerror = null;

        try {
          audio.pause();
        } catch {
          // Ignore cleanup errors.
        }

        audio.src = "";
        audioRef.current = null;
      }

      if (audioUrlRef.current) {
        try {
          URL.revokeObjectURL(audioUrlRef.current);
        } catch {
          // Ignore invalid/revoked URLs.
        }

        audioUrlRef.current = null;
      }
    };
  }, []);

  const clearError = useCallback(() => {
    if (mountedRef.current) {
      setError(null);
    }
  }, []);

  /*
   * Stop audio and release generated resources.
   */
  const cleanupAudio = useCallback(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.onplay = null;
      audio.onpause = null;
      audio.onended = null;
      audio.onerror = null;

      try {
        audio.pause();
      } catch {
        // Ignore playback cleanup errors.
      }

      audio.src = "";
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      try {
        URL.revokeObjectURL(audioUrlRef.current);
      } catch {
        // Ignore invalid/revoked URLs.
      }

      audioUrlRef.current = null;
    }

    if (mountedRef.current) {
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  /*
   * Stop current TTS operation.
   */
  const stopSpeaking = useCallback(() => {
    ttsOperationIdRef.current += 1;

    if (ttsControllerRef.current) {
      ttsControllerRef.current.abort();
      ttsControllerRef.current = null;
    }

    cleanupAudio();

    return true;
  }, [cleanupAudio]);

  /*
   * Return browser speech recognition constructor.
   */
  const getRecognitionConstructor = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return (
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      null
    );
  }, []);

  /*
   * Check microphone permission when the browser supports
   * the Permissions API.
   */
  const checkMicrophonePermission = useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.permissions
    ) {
      return "unknown";
    }

    try {
      const permission =
        await navigator.permissions.query({
          name: "microphone",
        });

      if (mountedRef.current) {
        setPermissionState(permission.state);
      }

      return permission.state;
    } catch {
      if (mountedRef.current) {
        setPermissionState("unknown");
      }

      return "unknown";
    }
  }, []);

  /*
   * Start browser-native speech recognition.
   */
  const startListening = useCallback(
    async ({
      continuous = false,
      interimResults = true,
    } = {}) => {
      clearError();

      if (recognitionRef.current) {
        return {
          success: false,
          error: "Voice recognition is already active.",
        };
      }

      const Recognition =
        getRecognitionConstructor();

      if (!Recognition) {
        const message =
          "Speech recognition is not supported by this browser.";

        if (mountedRef.current) {
          setError(message);
        }

        return {
          success: false,
          error: message,
        };
      }

      await checkMicrophonePermission();

      /*
       * Cancel any previous recognition session marker.
       */
      const sessionId =
        ++recognitionSessionRef.current;

      const recognition = new Recognition();

      recognitionRef.current = recognition;

      recognition.lang = languageRef.current;
      recognition.continuous = Boolean(continuous);
      recognition.interimResults = Boolean(interimResults);
      recognition.maxAlternatives = 1;

      if (mountedRef.current) {
        setIsListening(true);
        setInterimTranscript("");
        setFinalTranscript("");
      }

      return new Promise((resolve) => {
        let settled = false;

        const finish = (result) => {
          if (settled) {
            return;
          }

          settled = true;
          resolve(result);
        };

        recognition.onstart = () => {
          if (
            mountedRef.current &&
            sessionId ===
              recognitionSessionRef.current
          ) {
            setIsListening(true);
          }
        };

        recognition.onresult = (event) => {
          if (
            sessionId !==
            recognitionSessionRef.current
          ) {
            return;
          }

          let interim = "";
          let final = "";

          for (
            let index = event.resultIndex;
            index < event.results.length;
            index += 1
          ) {
            const result = event.results[index];

            const transcript =
              result?.[0]?.transcript || "";

            if (result?.isFinal) {
              final += transcript;
            } else {
              interim += transcript;
            }
          }

          if (!mountedRef.current) {
            return;
          }

          if (interim) {
            setInterimTranscript(interim);
          }

          if (final) {
            setFinalTranscript((previous) =>
              `${previous}${previous ? " " : ""}${final}`.trim()
            );

            setInterimTranscript("");
          }
        };

        recognition.onerror = (event) => {
          if (
            sessionId !==
            recognitionSessionRef.current
          ) {
            return;
          }

          const recognitionError =
            event?.error;

          /*
           * "aborted" means the session was intentionally
           * cancelled.
           */
          if (recognitionError === "aborted") {
            finish({
              success: false,
              cancelled: true,
            });

            return;
          }

          let message =
            "Speech recognition failed.";

          if (recognitionError === "not-allowed") {
            message =
              "Microphone permission was denied.";
          } else if (
            recognitionError === "audio-capture"
          ) {
            message =
              "No working microphone was detected.";
          } else if (
            recognitionError === "no-speech"
          ) {
            message =
              "No speech was detected.";
          } else if (
            recognitionError === "network"
          ) {
            message =
              "Speech recognition network error.";
          } else if (
            recognitionError === "service-not-allowed"
          ) {
            message =
              "Speech recognition service is not allowed.";
          }

          if (mountedRef.current) {
            setError(message);
            setIsListening(false);
          }

          finish({
            success: false,
            error: message,
          });
        };

        recognition.onend = () => {
          if (
            recognitionRef.current === recognition
          ) {
            recognitionRef.current = null;
          }

          if (
            mountedRef.current &&
            sessionId ===
              recognitionSessionRef.current
          ) {
            setIsListening(false);
          }

          finish({
            success: true,
            transcript: finalTranscript,
          });
        };

        try {
          recognition.start();
        } catch (err) {
          const message = normalizeError(err);

          if (mountedRef.current) {
            setError(message);
            setIsListening(false);
          }

          if (
            recognitionRef.current === recognition
          ) {
            recognitionRef.current = null;
          }

          finish({
            success: false,
            error: message,
          });
        }
      });
    },
    [
      checkMicrophonePermission,
      clearError,
      getRecognitionConstructor,
    ]
  );

  /*
   * Stop recognition gracefully.
   */
  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;

    if (!recognition) {
      return false;
    }

    try {
      recognition.stop();
    } catch {
      // Recognition may already be stopped.
    }

    return true;
  }, []);

  /*
   * Abort recognition and active STT request.
   */
  const cancelListening = useCallback(() => {
    recognitionSessionRef.current += 1;

    const recognition = recognitionRef.current;

    if (recognition) {
      try {
        recognition.abort();
      } catch {
        // Ignore already stopped recognition.
      }

      recognitionRef.current = null;
    }

    sttOperationIdRef.current += 1;

    if (sttControllerRef.current) {
      sttControllerRef.current.abort();
      sttControllerRef.current = null;
    }

    if (mountedRef.current) {
      setIsListening(false);
      setIsTranscribing(false);
      setInterimTranscript("");
    }

    return true;
  }, []);

  /*
   * Send audio to backend speech-to-text service.
   */
  const transcribeAudio = useCallback(
    async (audio, options = {}) => {
      if (!audio) {
        const message =
          "No audio was provided.";

        if (mountedRef.current) {
          setError(message);
        }

        return {
          success: false,
          error: message,
        };
      }

      if (
        typeof voiceService.speechToText !==
        "function"
      ) {
        const message =
          "voiceService.speechToText is not available.";

        if (mountedRef.current) {
          setError(message);
        }

        return {
          success: false,
          error: message,
        };
      }

      /*
       * Invalidate previous STT request.
       */
      sttOperationIdRef.current += 1;

      const operationId =
        sttOperationIdRef.current;

      sttControllerRef.current?.abort();

      const controller =
        new AbortController();

      sttControllerRef.current = controller;

      if (mountedRef.current) {
        setIsTranscribing(true);
        setError(null);
      }

      try {
        const response =
          await voiceService.speechToText(
            audio,
            {
              ...options,
              language:
                options.language ??
                languageRef.current,
              signal: controller.signal,
            }
          );

        if (
          controller.signal.aborted
        ) {
          throw createAbortError(
            "Speech transcription cancelled."
          );
        }

        if (
          operationId !==
          sttOperationIdRef.current
        ) {
          return {
            success: false,
            stale: true,
          };
        }

        const transcript =
          extractTranscript(response);

        if (!transcript) {
          throw new Error(
            "No transcript was returned."
          );
        }

        if (mountedRef.current) {
          setFinalTranscript(transcript);
          setInterimTranscript("");
        }

        return {
          success: true,
          transcript,
          response,
        };
      } catch (err) {
        if (
          isAbortError(err) ||
          controller.signal.aborted
        ) {
          return {
            success: false,
            cancelled: true,
          };
        }

        const message = normalizeError(err);

        if (
          mountedRef.current &&
          operationId ===
            sttOperationIdRef.current
        ) {
          setError(message);
        }

        return {
          success: false,
          error: message,
        };
      } finally {
        if (
          mountedRef.current &&
          operationId ===
            sttOperationIdRef.current
        ) {
          setIsTranscribing(false);
        }

        if (
          sttControllerRef.current ===
          controller
        ) {
          sttControllerRef.current = null;
        }
      }
    },
    []
  );

  /*
   * Cancel backend STT.
   */
  const cancelTranscription = useCallback(() => {
    sttOperationIdRef.current += 1;

    if (!sttControllerRef.current) {
      if (mountedRef.current) {
        setIsTranscribing(false);
      }

      return false;
    }

    sttControllerRef.current.abort();
    sttControllerRef.current = null;

    if (mountedRef.current) {
      setIsTranscribing(false);
    }

    return true;
  }, []);

  /*
   * Convert text to audio through backend TTS.
   */
  const speak = useCallback(
    async (text, options = {}) => {
      const cleanText =
        typeof text === "string"
          ? text.trim()
          : "";

      if (!cleanText) {
        const message =
          "No text was provided for speech.";

        if (mountedRef.current) {
          setError(message);
        }

        return {
          success: false,
          error: message,
        };
      }

      const safeMaxLength =
        Number.isFinite(maxTextLength) &&
        maxTextLength > 0
          ? maxTextLength
          : MAX_TTS_LENGTH;

      if (
        cleanText.length >
        safeMaxLength
      ) {
        const message =
          `Text is too long for speech. Maximum length is ${safeMaxLength} characters.`;

        if (mountedRef.current) {
          setError(message);
        }

        return {
          success: false,
          error: message,
        };
      }

      if (
        typeof voiceService.textToSpeech !==
        "function"
      ) {
        const message =
          "voiceService.textToSpeech is not available.";

        if (mountedRef.current) {
          setError(message);
        }

        return {
          success: false,
          error: message,
        };
      }

      clearError();

      if (autoStopBeforeSpeak) {
        stopSpeaking();
      } else {
        ttsControllerRef.current?.abort();
      }

      /*
       * Invalidate previous TTS operation.
       */
      ttsOperationIdRef.current += 1;

      const operationId =
        ttsOperationIdRef.current;

      const controller =
        new AbortController();

      ttsControllerRef.current = controller;

      try {
        const response =
          await voiceService.textToSpeech(
            cleanText,
            {
              ...options,
              language:
                options.language ??
                languageRef.current,
              signal: controller.signal,
            }
          );

        if (
          controller.signal.aborted
        ) {
          throw createAbortError(
            "Speech playback cancelled."
          );
        }

        if (
          operationId !==
          ttsOperationIdRef.current
        ) {
          return {
            success: false,
            stale: true,
          };
        }

        /*
         * Always clean up previous audio before
         * attaching new playback.
         */
        cleanupAudio();

        let audioSource =
          extractAudioSource(response);

        /*
         * Blob response.
         */
        if (isBlob(response)) {
          audioSource =
            URL.createObjectURL(response);

          audioUrlRef.current =
            audioSource;
        }

        /*
         * ArrayBuffer response.
         */
        if (isArrayBuffer(response)) {
          const blob =
            blobFromArrayBuffer(response);

          if (blob) {
            audioSource =
              URL.createObjectURL(blob);

            audioUrlRef.current =
              audioSource;
          }
        }

        if (
          typeof audioSource !== "string" ||
          !audioSource.trim()
        ) {
          throw new Error(
            "No audio data was returned."
          );
        }

        /*
         * If the service returned a blob URL,
         * keep track of it for cleanup.
         */
        if (
          audioSource.startsWith("blob:") &&
          !audioUrlRef.current
        ) {
          audioUrlRef.current =
            audioSource;
        }

        if (
          typeof Audio === "undefined"
        ) {
          throw new Error(
            "Audio playback is not supported by this browser."
          );
        }

        const audio =
          new Audio(audioSource);

        audio.preload = "auto";

        audioRef.current = audio;

        audio.onplay = () => {
          if (
            mountedRef.current &&
            operationId ===
              ttsOperationIdRef.current
          ) {
            setIsSpeaking(true);
            setIsPaused(false);
          }
        };

        audio.onpause = () => {
          if (
            mountedRef.current &&
            operationId ===
              ttsOperationIdRef.current &&
            !audio.ended
          ) {
            setIsPaused(true);
            setIsSpeaking(false);
          }
        };

        audio.onended = () => {
          if (
            audioRef.current === audio
          ) {
            cleanupAudio();
          }
        };

        audio.onerror = () => {
          if (
            mountedRef.current &&
            operationId ===
              ttsOperationIdRef.current
          ) {
            setError(
              "Unable to play the generated audio."
            );
          }

          if (
            audioRef.current === audio
          ) {
            cleanupAudio();
          }
        };

        if (mountedRef.current) {
          setIsSpeaking(true);
          setIsPaused(false);
        }

        await audio.play();

        /*
         * The operation may have been cancelled while
         * audio.play() was pending.
         */
        if (
          operationId !==
          ttsOperationIdRef.current
        ) {
          if (
            audioRef.current === audio
          ) {
            cleanupAudio();
          }

          return {
            success: false,
            stale: true,
          };
        }

        return {
          success: true,
          audio,
          response,
        };
      } catch (err) {
        if (
          isAbortError(err) ||
          controller.signal.aborted
        ) {
          return {
            success: false,
            cancelled: true,
          };
        }

        const message = normalizeError(err);

        if (
          mountedRef.current &&
          operationId ===
            ttsOperationIdRef.current
        ) {
          setError(message);
          setIsSpeaking(false);
          setIsPaused(false);
        }

        cleanupAudio();

        return {
          success: false,
          error: message,
        };
      } finally {
        if (
          ttsControllerRef.current ===
          controller
        ) {
          ttsControllerRef.current = null;
        }
      }
    },
    [
      autoStopBeforeSpeak,
      cleanupAudio,
      clearError,
      maxTextLength,
      stopSpeaking,
    ]
  );

  /*
   * Pause current TTS playback.
   */
  const pauseSpeaking = useCallback(() => {
    const audio = audioRef.current;

    if (!audio || audio.paused) {
      return false;
    }

    try {
      audio.pause();
    } catch {
      return false;
    }

    if (mountedRef.current) {
      setIsPaused(true);
      setIsSpeaking(false);
    }

    return true;
  }, []);

  /*
   * Resume paused TTS playback.
   */
  const resumeSpeaking = useCallback(async () => {
    const audio = audioRef.current;

    if (!audio) {
      return false;
    }

    try {
      await audio.play();

      if (mountedRef.current) {
        setIsSpeaking(true);
        setIsPaused(false);
      }

      return true;
    } catch (err) {
      if (!mountedRef.current) {
        return false;
      }

      const message = normalizeError(err);

      setError(message);

      return false;
    }
  }, []);

  /*
   * Clear transcript.
   */
  const clearTranscript = useCallback(() => {
    if (mountedRef.current) {
      setInterimTranscript("");
      setFinalTranscript("");
    }

    return true;
  }, []);

  /*
   * Combined transcript.
   */
  const transcript = useMemo(() => {
    if (finalTranscript) {
      return finalTranscript;
    }

    return interimTranscript || "";
  }, [finalTranscript, interimTranscript]);

  return {
    /*
     * Speech-to-text state
     */
    isListening,
    isTranscribing,
    interimTranscript,
    finalTranscript,
    transcript,

    /*
     * Text-to-speech state
     */
    isSpeaking,
    isPaused,

    /*
     * Permissions
     */
    permissionState,

    /*
     * Errors
     */
    error,

    /*
     * Language
     */
    language,

    /*
     * STT controls
     */
    startListening,
    stopListening,
    cancelListening,
    transcribeAudio,
    cancelTranscription,

    /*
     * TTS controls
     */
    speak,
    pauseSpeaking,
    resumeSpeaking,
    stopSpeaking,

    /*
     * Transcript
     */
    clearTranscript,

    /*
     * General
     */
    clearError,
    checkMicrophonePermission,
  };
};

export default useVoice;
