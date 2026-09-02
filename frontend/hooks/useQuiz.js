import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useQuizContext } from "../context/QuizContext";
import * as quizService from "../services/quizService";

const MAX_QUESTION_COUNT = 100;
const MIN_QUESTION_COUNT = 1;

const MIN_DURATION = 30;
const MAX_DURATION = 24 * 60 * 60;

const QUIZ_STATUS = {
  IDLE: "IDLE",
  LOADING: "LOADING",
  READY: "READY",
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTING: "SUBMITTING",
  COMPLETED: "COMPLETED",
  ERROR: "ERROR",
};

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

  return "Something went wrong while processing the quiz.";
};

const isAbortError = (error) => {
  const message =
    error?.message?.toLowerCase?.() || "";

  return (
    error?.name === "AbortError" ||
    error?.code === "ERR_CANCELED" ||
    error?.code === "ECONNABORTED" ||
    message.includes("aborted") ||
    message.includes("cancelled") ||
    message.includes("canceled")
  );
};

const extractQuestions = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.questions)) {
    return response.questions;
  }

  if (Array.isArray(response?.data?.questions)) {
    return response.data.questions;
  }

  if (Array.isArray(response?.quiz?.questions)) {
    return response.quiz.questions;
  }

  if (Array.isArray(response?.data?.quiz?.questions)) {
    return response.data.quiz.questions;
  }

  return [];
};

const extractQuiz = (response) => {
  if (!response) {
    return null;
  }

  if (response.quiz) {
    return response.quiz;
  }

  if (response.data?.quiz) {
    return response.data.quiz;
  }

  return response;
};

const validateConfig = (config) => {
  const questionCount = Number(
    config?.questionCount
  );

  const duration = Number(
    config?.duration
  );

  if (
    !Number.isInteger(questionCount) ||
    questionCount < MIN_QUESTION_COUNT ||
    questionCount > MAX_QUESTION_COUNT
  ) {
    return {
      valid: false,
      error: `Question count must be between ${MIN_QUESTION_COUNT} and ${MAX_QUESTION_COUNT}.`,
    };
  }

  if (
    !Number.isFinite(duration) ||
    duration < MIN_DURATION ||
    duration > MAX_DURATION
  ) {
    return {
      valid: false,
      error: `Quiz duration must be between ${MIN_DURATION} seconds and ${MAX_DURATION} seconds.`,
    };
  }

  if (!config?.questionType) {
    return {
      valid: false,
      error: "Question type is required.",
    };
  }

  if (!config?.difficulty) {
    return {
      valid: false,
      error: "Difficulty is required.",
    };
  }

  return {
    valid: true,
    error: null,
  };
};

const hasAnswer = (answer) => {
  if (answer === undefined || answer === null) {
    return false;
  }

  if (typeof answer === "string") {
    return answer.trim().length > 0;
  }

  return true;
};

export const useQuiz = () => {
  const {
    quiz,
    questions,
    currentQuestion,
    currentQuestionIndex,
    answers,
    markedQuestions,
    quizStatus,
    timeRemaining,
    startedAt,
    expiresAt,
    result,
    error,

    setQuiz,
    setQuizConfig,
    startQuiz,
    setCurrentQuestion,
    nextQuestion,
    previousQuestion,
    answerQuestion,
    clearAnswer,
    toggleQuestionMark,
    isQuestionMarked,
    updateTimeRemaining,
    decrementTimer,
    beginSubmission,
    submitQuiz,
    expireQuiz,
    setError,
    clearError,
    resetQuiz,
    clearQuiz,
    getAnswer,
    getQuestion,
  } = useQuizContext();

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [generationError, setGenerationError] =
    useState(null);

  const [submissionError, setSubmissionError] =
    useState(null);

  const mountedRef = useRef(true);

  const generationControllerRef =
    useRef(null);

  const submissionControllerRef =
    useRef(null);

  const generationRequestRef =
    useRef(0);

  const submissionRequestRef =
    useRef(0);

  const expirationHandledRef =
    useRef(false);

  /*
   * Track mounted state and cancel
   * network operations on unmount.
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      generationControllerRef.current?.abort();
      submissionControllerRef.current?.abort();

      generationControllerRef.current = null;
      submissionControllerRef.current = null;
    };
  }, []);

  /*
   * Reset expiration guard whenever a
   * new active quiz starts.
   */
  useEffect(() => {
    if (quizStatus !== QUIZ_STATUS.IN_PROGRESS) {
      expirationHandledRef.current = false;
      return;
    }

    if (timeRemaining > 0) {
      expirationHandledRef.current = false;
    }
  }, [quizStatus, timeRemaining]);

  /*
   * Update quiz configuration.
   */
  const updateConfig = useCallback(
    (updates) => {
      if (!updates || typeof updates !== "object") {
        return false;
      }

      setQuizConfig(updates);
      return true;
    },
    [setQuizConfig]
  );

  /*
   * Generate a new quiz.
   */
  const generateQuiz = useCallback(
    async (configOverride = null) => {
      if (isGenerating) {
        return {
          success: false,
          error: "A quiz is already being generated.",
        };
      }

      const config =
        configOverride ||
        quiz?.config ||
        {};

      const validation =
        validateConfig(config);

      if (!validation.valid) {
        setGenerationError(validation.error);
        setError(validation.error);

        return {
          success: false,
          error: validation.error,
        };
      }

      /*
       * Invalidate any previous request.
       */
      generationControllerRef.current?.abort();

      const controller =
        new AbortController();

      generationControllerRef.current =
        controller;

      const requestId =
        ++generationRequestRef.current;

      setIsGenerating(true);
      setGenerationError(null);
      clearError();

      setQuizConfig(config);

      try {
        if (
          typeof quizService.generateQuiz !==
          "function"
        ) {
          throw new Error(
            "quizService.generateQuiz is not available."
          );
        }

        const response =
          await quizService.generateQuiz(
            config,
            {
              signal: controller.signal,
            }
          );

        /*
         * Ignore stale requests.
         */
        if (
          requestId !==
          generationRequestRef.current
        ) {
          return {
            success: false,
            stale: true,
          };
        }

        if (controller.signal.aborted) {
          throw new DOMException(
            "Quiz generation cancelled.",
            "AbortError"
          );
        }

        const generatedQuestions =
          extractQuestions(response);

        if (
          generatedQuestions.length === 0
        ) {
          throw new Error(
            "The server returned no quiz questions."
          );
        }

        const generatedQuiz =
          extractQuiz(response);

        const quizData = {
          ...(generatedQuiz || {}),
          config,
          questions:
            generatedQuestions,
        };

        setQuiz(quizData);

        return {
          success: true,
          quiz: quizData,
          questions:
            generatedQuestions,
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

        const message =
          normalizeError(err);

        if (
          mountedRef.current &&
          requestId ===
            generationRequestRef.current
        ) {
          setGenerationError(message);
          setError(message);
        }

        return {
          success: false,
          error: message,
        };
      } finally {
        if (
          mountedRef.current &&
          requestId ===
            generationRequestRef.current
        ) {
          setIsGenerating(false);
        }

        if (
          generationControllerRef.current ===
          controller
        ) {
          generationControllerRef.current =
            null;
        }
      }
    },
    [
      isGenerating,
      quiz,
      setQuizConfig,
      setQuiz,
      setError,
      clearError,
    ]
  );

  /*
   * Cancel quiz generation.
   */
  const cancelGeneration =
    useCallback(() => {
      const controller =
        generationControllerRef.current;

      if (!controller) {
        return false;
      }

      generationRequestRef.current += 1;

      controller.abort();

      generationControllerRef.current =
        null;

      if (mountedRef.current) {
        setIsGenerating(false);
      }

      return true;
    }, []);

  /*
   * Start the generated quiz.
   */
  const beginQuiz = useCallback(() => {
    if (!questions?.length) {
      const message =
        "Generate a quiz before starting.";

      setError(message);

      return {
        success: false,
        error: message,
      };
    }

    if (quizStatus === QUIZ_STATUS.IN_PROGRESS) {
      return {
        success: true,
        alreadyStarted: true,
      };
    }

    if (
      quizStatus ===
        QUIZ_STATUS.SUBMITTING ||
      quizStatus ===
        QUIZ_STATUS.COMPLETED
    ) {
      return {
        success: false,
        error:
          "The current quiz cannot be started again.",
      };
    }

    try {
      startQuiz();

      expirationHandledRef.current = false;

      return {
        success: true,
      };
    } catch (err) {
      const message =
        normalizeError(err);

      setError(message);

      return {
        success: false,
        error: message,
      };
    }
  }, [
    questions,
    quizStatus,
    startQuiz,
    setError,
  ]);

  /*
   * Answer current question.
   */
  const answerCurrentQuestion =
    useCallback(
      (answer) => {
        if (!currentQuestion) {
          return {
            success: false,
            error:
              "There is no active question.",
          };
        }

        if (
          quizStatus !==
          QUIZ_STATUS.IN_PROGRESS
        ) {
          return {
            success: false,
            error:
              "The quiz is not currently active.",
          };
        }

        if (
          answer === undefined ||
          answer === null
        ) {
          return {
            success: false,
            error: "An answer is required.",
          };
        }

        answerQuestion(
          currentQuestion.id,
          answer
        );

        return {
          success: true,
        };
      },
      [
        currentQuestion,
        quizStatus,
        answerQuestion,
      ]
    );

  /*
   * Answer any question by ID.
   */
  const answerByQuestionId =
    useCallback(
      (questionId, answer) => {
        if (!questionId) {
          return {
            success: false,
            error:
              "Question ID is required.",
          };
        }

        if (
          quizStatus !==
          QUIZ_STATUS.IN_PROGRESS
        ) {
          return {
            success: false,
            error:
              "The quiz is not currently active.",
          };
        }

        const question =
          getQuestion(questionId);

        if (!question) {
          return {
            success: false,
            error:
              "Question not found.",
          };
        }

        if (
          answer === undefined ||
          answer === null
        ) {
          return {
            success: false,
            error: "An answer is required.",
          };
        }

        answerQuestion(
          questionId,
          answer
        );

        return {
          success: true,
        };
      },
      [
        quizStatus,
        getQuestion,
        answerQuestion,
      ]
    );

  /*
   * Move to next question.
   */
  const goNext = useCallback(() => {
    if (!questions?.length) {
      return {
        success: false,
        error: "No questions available.",
      };
    }

    if (
      currentQuestionIndex >=
      questions.length - 1
    ) {
      return {
        success: false,
        lastQuestion: true,
      };
    }

    nextQuestion();

    return {
      success: true,
    };
  }, [
    currentQuestionIndex,
    questions,
    nextQuestion,
  ]);

  /*
   * Move to previous question.
   */
  const goPrevious =
    useCallback(() => {
      if (
        currentQuestionIndex <= 0
      ) {
        return {
          success: false,
          firstQuestion: true,
        };
      }

      previousQuestion();

      return {
        success: true,
      };
    }, [
      currentQuestionIndex,
      previousQuestion,
    ]);

  /*
   * Jump directly to a question.
   */
  const goToQuestion =
    useCallback(
      (index) => {
        const numericIndex =
          Number(index);

        if (
          !Number.isInteger(
            numericIndex
          )
        ) {
          return {
            success: false,
            error:
              "Question index must be an integer.",
          };
        }

        if (
          numericIndex < 0 ||
          numericIndex >=
            questions.length
        ) {
          return {
            success: false,
            error:
              "Question index is out of range.",
          };
        }

        setCurrentQuestion(
          numericIndex
        );

        return {
          success: true,
          index: numericIndex,
        };
      },
      [
        questions.length,
        setCurrentQuestion,
      ]
    );

  /*
   * Toggle question mark.
   */
  const toggleMark =
    useCallback(
      (
        questionId =
          currentQuestion?.id
      ) => {
        if (!questionId) {
          return {
            success: false,
            error:
              "Question ID is required.",
          };
        }

        const question =
          getQuestion(questionId);

        if (!question) {
          return {
            success: false,
            error:
              "Question not found.",
          };
        }

        const wasMarked =
          isQuestionMarked(
            questionId
          );

        toggleQuestionMark(
          questionId
        );

        return {
          success: true,
          marked: !wasMarked,
        };
      },
      [
        currentQuestion,
        getQuestion,
        isQuestionMarked,
        toggleQuestionMark,
      ]
    );

  /*
   * Submit/evaluate quiz.
   */
  const submitQuizAnswers =
    useCallback(
      async (options = {}) => {
        if (isSubmitting) {
          return {
            success: false,
            error:
              "Quiz submission is already in progress.",
          };
        }

        if (!questions?.length) {
          const message =
            "There are no questions to submit.";

          setSubmissionError(message);
          setError(message);

          return {
            success: false,
            error: message,
          };
        }

        /*
         * Submission is allowed from an active
         * quiz or from the timer-expired state.
         */
        if (
          quizStatus !==
            QUIZ_STATUS.IN_PROGRESS &&
          quizStatus !==
            QUIZ_STATUS.SUBMITTING
        ) {
          return {
            success: false,
            error:
              "The quiz is not ready for submission.",
          };
        }

        /*
         * Move to SUBMITTING only once.
         */
        if (
          quizStatus !==
          QUIZ_STATUS.SUBMITTING
        ) {
          beginSubmission();
        }

        submissionControllerRef.current?.abort();

        const controller =
          new AbortController();

        submissionControllerRef.current =
          controller;

        const requestId =
          ++submissionRequestRef.current;

        setIsSubmitting(true);
        setSubmissionError(null);
        clearError();

        try {
          const payload = {
            quizId:
              quiz?.id ??
              quiz?.quizId ??
              null,
            questions,
            answers,
            config: quiz?.config ?? null,
            startedAt:
              startedAt ?? null,
            expiresAt:
              expiresAt ?? null,
            timeRemaining:
              timeRemaining ?? 0,
            ...options,
          };

          let response;

          if (
            typeof quizService.submitQuiz ===
            "function"
          ) {
            response =
              await quizService.submitQuiz(
                payload,
                {
                  signal:
                    controller.signal,
                }
              );
          } else if (
            typeof quizService.evaluateQuiz ===
            "function"
          ) {
            response =
              await quizService.evaluateQuiz(
                payload,
                {
                  signal:
                    controller.signal,
                }
              );
          } else {
            throw new Error(
              "quizService does not provide a quiz submission function."
            );
          }

          if (
            requestId !==
            submissionRequestRef.current
          ) {
            return {
              success: false,
              stale: true,
            };
          }

          if (
            controller.signal.aborted
          ) {
            throw new DOMException(
              "Quiz submission cancelled.",
              "AbortError"
            );
          }

          const finalResult =
            response?.result ??
            response?.data?.result ??
            response;

          if (
            finalResult === undefined ||
            finalResult === null
          ) {
            throw new Error(
              "The server returned no quiz result."
            );
          }

          submitQuiz(finalResult);

          return {
            success: true,
            result: finalResult,
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

          const message =
            normalizeError(err);

          if (
            mountedRef.current &&
            requestId ===
              submissionRequestRef.current
          ) {
            setSubmissionError(message);
            setError(message);
          }

          return {
            success: false,
            error: message,
          };
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              submissionRequestRef.current
          ) {
            setIsSubmitting(false);
          }

          if (
            submissionControllerRef.current ===
            controller
          ) {
            submissionControllerRef.current =
              null;
          }
        }
      },
      [
        isSubmitting,
        questions,
        quizStatus,
        quiz,
        answers,
        startedAt,
        expiresAt,
        timeRemaining,
        beginSubmission,
        submitQuiz,
        setError,
        clearError,
      ]
    );

  /*
   * Handle timer expiration.
   *
   * Expiration is deliberately split into:
   * 1. Context → SUBMITTING
   * 2. Service → evaluation
   * 3. Context → COMPLETED
   */
  const handleExpiration =
    useCallback(async () => {
      if (
        expirationHandledRef.current
      ) {
        return {
          success: false,
          alreadyHandled: true,
        };
      }

      if (
        quizStatus !==
        QUIZ_STATUS.IN_PROGRESS
      ) {
        return {
          success: false,
          inactive: true,
        };
      }

      expirationHandledRef.current = true;

      /*
       * expireQuiz() changes the context status
       * to SUBMITTING.
       */
      expireQuiz();

      /*
       * Do not depend on the immediately updated
       * quizStatus value. React state updates are
       * asynchronous, while submitQuizAnswers()
       * already accepts SUBMITTING.
       */
      return submitQuizAnswers({
        expired: true,
        autoSubmitted: true,
      });
    }, [
      quizStatus,
      expireQuiz,
      submitQuizAnswers,
    ]);

  /*
   * Update timer value.
   */
  const updateTimer =
    useCallback(
      (seconds) => {
        const value =
          Number(seconds);

        if (
          !Number.isFinite(value) ||
          value < 0
        ) {
          return false;
        }

        updateTimeRemaining(
          Math.max(
            0,
            Math.floor(value)
          )
        );

        return true;
      },
      [updateTimeRemaining]
    );

  /*
   * Decrement timer by one tick.
   */
  const tickTimer =
    useCallback(() => {
      if (
        quizStatus !==
        QUIZ_STATUS.IN_PROGRESS
      ) {
        return false;
      }

      if (timeRemaining <= 0) {
        return false;
      }

      decrementTimer();

      return true;
    }, [
      quizStatus,
      timeRemaining,
      decrementTimer,
    ]);

  /*
   * Retry quiz generation.
   */
  const retryQuiz =
    useCallback(
      async (configOverride = null) => {
        setGenerationError(null);
        clearError();

        return generateQuiz(
          configOverride
        );
      },
      [
        generateQuiz,
        clearError,
      ]
    );

  /*
   * Clear generation error.
   */
  const clearGenerationError =
    useCallback(() => {
      setGenerationError(null);
      clearError();
    }, [clearError]);

  /*
   * Clear submission error.
   */
  const clearSubmissionError =
    useCallback(() => {
      setSubmissionError(null);
      clearError();
    }, [clearError]);

  /*
   * Cancel submission.
   */
  const cancelSubmission =
    useCallback(() => {
      const controller =
        submissionControllerRef.current;

      if (!controller) {
        return false;
      }

      submissionRequestRef.current += 1;

      controller.abort();

      submissionControllerRef.current =
        null;

      if (mountedRef.current) {
        setIsSubmitting(false);
      }

      return true;
    }, []);

  /*
   * Reset entire quiz workflow.
   */
  const reset =
    useCallback(() => {
      generationControllerRef.current?.abort();
      submissionControllerRef.current?.abort();

      generationControllerRef.current =
        null;

      submissionControllerRef.current =
        null;

      generationRequestRef.current += 1;
      submissionRequestRef.current += 1;

      expirationHandledRef.current = false;

      setIsGenerating(false);
      setIsSubmitting(false);

      setGenerationError(null);
      setSubmissionError(null);

      resetQuiz();

      return true;
    }, [resetQuiz]);

  /*
   * Completely clear quiz data.
   */
  const clear =
    useCallback(() => {
      generationControllerRef.current?.abort();
      submissionControllerRef.current?.abort();

      generationControllerRef.current =
        null;

      submissionControllerRef.current =
        null;

      generationRequestRef.current += 1;
      submissionRequestRef.current += 1;

      expirationHandledRef.current = false;

      setIsGenerating(false);
      setIsSubmitting(false);

      setGenerationError(null);
      setSubmissionError(null);

      clearQuiz();

      return true;
    }, [clearQuiz]);

  /*
   * Derived values for UI.
   */
  const totalQuestions =
    questions?.length || 0;

  const answeredCount =
    Object.values(
      answers || {}
    ).filter(hasAnswer).length;

  const unansweredCount =
    Math.max(
      0,
      totalQuestions -
        answeredCount
    );

  const markedCount =
    Array.isArray(markedQuestions)
      ? markedQuestions.length
      : Object.values(
          markedQuestions || {}
        ).filter(Boolean).length;

  const isFirstQuestion =
    totalQuestions === 0 ||
    currentQuestionIndex <= 0;

  const isLastQuestion =
    totalQuestions === 0 ||
    currentQuestionIndex >=
      totalQuestions - 1;

  const isActive =
    quizStatus ===
      QUIZ_STATUS.IN_PROGRESS ||
    quizStatus ===
      QUIZ_STATUS.SUBMITTING;

  const isCompleted =
    quizStatus ===
    QUIZ_STATUS.COMPLETED;

  const isLoading =
    quizStatus ===
      QUIZ_STATUS.LOADING ||
    isGenerating ||
    isSubmitting;

  const hasQuiz =
    totalQuestions > 0;

  return {
    /*
     * Quiz data
     */
    quiz,
    questions,
    currentQuestion,
    currentQuestionIndex,
    answers,
    markedQuestions,
    result,

    /*
     * Timer
     */
    timeRemaining,
    startedAt,
    expiresAt,

    /*
     * Status
     */
    quizStatus,
    error,
    generationError,
    submissionError,

    /*
     * Loading states
     */
    isGenerating,
    isSubmitting,
    isLoading,
    isActive,
    isCompleted,
    hasQuiz,

    /*
     * Counts
     */
    totalQuestions,
    answeredCount,
    unansweredCount,
    markedCount,

    /*
     * Navigation state
     */
    isFirstQuestion,
    isLastQuestion,

    /*
     * Configuration
     */
    updateConfig,
    setQuizConfig,

    /*
     * Generation
     */
    generateQuiz,
    retryQuiz,
    cancelGeneration,

    /*
     * Lifecycle
     */
    beginQuiz,
    submitQuiz:
      submitQuizAnswers,
    handleExpiration,

    /*
     * Answers
     */
    answerQuestion:
      answerCurrentQuestion,
    answerByQuestionId,
    clearAnswer,
    getAnswer,

    /*
     * Navigation
     */
    nextQuestion:
      goNext,
    previousQuestion:
      goPrevious,
    goToQuestion,

    /*
     * Marking
     */
    toggleMark,
    isQuestionMarked,

    /*
     * Timer coordination
     */
    updateTimer,
    tickTimer,

    /*
     * Submission
     */
    beginSubmission,
    cancelSubmission,

    /*
     * Error handling
     */
    clearGenerationError,
    clearSubmissionError,
    clearError,

    /*
     * Reset
     */
    resetQuiz: reset,
    clearQuiz: clear,

    /*
     * Direct context helper
     */
    getQuestion,
  };
};

export default useQuiz;
