import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const QuizContext = createContext(null);

const STORAGE_KEY = "offsedu_quiz_state";

export const QUIZ_STATUS = Object.freeze({
  IDLE: "IDLE",
  LOADING: "LOADING",
  READY: "READY",
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTING: "SUBMITTING",
  COMPLETED: "COMPLETED",
  ERROR: "ERROR",
});

export const QUESTION_TYPES = Object.freeze({
  MCQ: "mcq",
  TRUE_FALSE: "true_false",
  SHORT_ANSWER: "short_answer",
  LONG_ANSWER: "long_answer",
});

export const DEFAULT_QUIZ_CONFIG = Object.freeze({
  questionType: QUESTION_TYPES.MCQ,
  difficulty: "medium",
  questionCount: 10,
  duration: 600,
  subject: "",
  sourceDocumentId: null,
});

const MAX_QUESTIONS = 100;
const MAX_ANSWER_LENGTH = 20000;
const MAX_SUBJECT_LENGTH = 500;

const isBrowser = () =>
  typeof window !== "undefined";

const generateId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
};

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const clamp = (value, min, max) =>
  Math.min(Math.max(value, min), max);

const normalizeQuestion = (
  question,
  index
) => {
  if (!question || typeof question !== "object") {
    return null;
  }

  return {
    id:
      question.id ||
      question.questionId ||
      `question-${index + 1}`,

    question:
      typeof question.question === "string"
        ? question.question.trim()
        : "",

    type:
      question.type ||
      QUESTION_TYPES.MCQ,

    options: Array.isArray(question.options)
      ? question.options.map((option) => {
          if (
            typeof option === "string"
          ) {
            return option;
          }

          return {
            value:
              option?.value ??
              option?.id ??
              "",
            label:
              option?.label ??
              option?.text ??
              "",
          };
        })
      : [],

    marks:
      Number.isFinite(Number(question.marks))
        ? Number(question.marks)
        : 1,

    metadata:
      question.metadata &&
      typeof question.metadata === "object"
        ? question.metadata
        : {},
  };
};

const normalizeQuestions = (questions) => {
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions
    .slice(0, MAX_QUESTIONS)
    .map(normalizeQuestion)
    .filter(
      (question) =>
        question &&
        question.question
    );
};

const normalizeConfig = (config = {}) => {
  const questionCount = Number(
    config.questionCount
  );

  const duration = Number(
    config.duration
  );

  const subject =
    typeof config.subject === "string"
      ? config.subject
          .trim()
          .slice(0, MAX_SUBJECT_LENGTH)
      : "";

  return {
    ...DEFAULT_QUIZ_CONFIG,
    ...config,

    questionType:
      config.questionType ||
      DEFAULT_QUIZ_CONFIG.questionType,

    difficulty:
      config.difficulty ||
      DEFAULT_QUIZ_CONFIG.difficulty,

    questionCount: clamp(
      Number.isFinite(questionCount)
        ? Math.floor(questionCount)
        : DEFAULT_QUIZ_CONFIG.questionCount,
      1,
      MAX_QUESTIONS
    ),

    duration: clamp(
      Number.isFinite(duration)
        ? Math.floor(duration)
        : DEFAULT_QUIZ_CONFIG.duration,
      0,
      86400
    ),

    subject,

    sourceDocumentId:
      config.sourceDocumentId || null,
  };
};

const normalizeAnswers = (
  answers,
  questions
) => {
  if (
    !answers ||
    typeof answers !== "object"
  ) {
    return {};
  }

  const validIds = new Set(
    questions.map(
      (question) => question.id
    )
  );

  return Object.entries(answers).reduce(
    (result, [questionId, answer]) => {
      if (!validIds.has(questionId)) {
        return result;
      }

      if (
        typeof answer === "string" &&
        answer.length > MAX_ANSWER_LENGTH
      ) {
        result[questionId] =
          answer.slice(
            0,
            MAX_ANSWER_LENGTH
          );
      } else {
        result[questionId] = answer;
      }

      return result;
    },
    {}
  );
};

const loadStoredState = () => {
  if (!isBrowser()) {
    return null;
  }

  try {
    const stored =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!stored) {
      return null;
    }

    const parsed = safeParse(stored);

    if (
      !parsed ||
      typeof parsed !== "object"
    ) {
      return null;
    }

    const questions =
      normalizeQuestions(
        parsed.questions
      );

    const config =
      normalizeConfig(
        parsed.config
      );

    const currentQuestionIndex =
      clamp(
        Number.isFinite(
          Number(
            parsed.currentQuestionIndex
          )
        )
          ? Math.floor(
              Number(
                parsed.currentQuestionIndex
              )
            )
          : 0,
        0,
        Math.max(
          questions.length - 1,
          0
        )
      );

    const status =
      Object.values(
        QUIZ_STATUS
      ).includes(parsed.quizStatus)
        ? parsed.quizStatus
        : QUIZ_STATUS.IDLE;

    const answers =
      normalizeAnswers(
        parsed.answers,
        questions
      );

    const markedQuestions =
      Array.isArray(
        parsed.markedQuestions
      )
        ? parsed.markedQuestions.filter(
            (id) =>
              questions.some(
                (question) =>
                  question.id === id
              )
          )
        : [];

    let timeRemaining =
      Number(parsed.timeRemaining);

    if (!Number.isFinite(timeRemaining)) {
      timeRemaining =
        config.duration;
    }

    timeRemaining = clamp(
      Math.floor(timeRemaining),
      0,
      config.duration || 86400
    );

    /*
     * Restored active quizzes must use
     * expiresAt as the source of truth.
     */
    let expiresAt =
      Number(parsed.expiresAt);

    if (
      !Number.isFinite(expiresAt) ||
      expiresAt <= 0
    ) {
      expiresAt = null;
    }

    let restoredStatus = status;

    if (
      expiresAt &&
      expiresAt <= Date.now() &&
      status === QUIZ_STATUS.IN_PROGRESS
    ) {
      restoredStatus =
        QUIZ_STATUS.COMPLETED;

      timeRemaining = 0;
    }

    /*
     * SUBMITTING cannot safely survive a refresh.
     * Restore it as IN_PROGRESS.
     */
    if (
      restoredStatus ===
      QUIZ_STATUS.SUBMITTING
    ) {
      restoredStatus =
        QUIZ_STATUS.IN_PROGRESS;
    }

    return {
      quiz: parsed.quiz || null,
      questions,
      currentQuestionIndex,
      answers,
      markedQuestions,
      quizStatus: restoredStatus,
      timeRemaining,
      startedAt:
        Number.isFinite(
          Number(parsed.startedAt)
        )
          ? Number(parsed.startedAt)
          : null,
      expiresAt,
      result: parsed.result || null,
      error: null,
    };
  } catch {
    return null;
  }
};

const INITIAL_STATE = {
  quiz: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  markedQuestions: [],
  quizStatus: QUIZ_STATUS.IDLE,
  timeRemaining: 0,
  startedAt: null,
  expiresAt: null,
  result: null,
  error: null,
};

export const QuizProvider = ({
  children,
}) => {
  const [quiz, setQuizState] =
    useState(null);

  const [questions, setQuestions] =
    useState([]);

  const [
    currentQuestionIndex,
    setCurrentQuestionIndex,
  ] = useState(0);

  const [answers, setAnswers] =
    useState({});

  const [
    markedQuestions,
    setMarkedQuestions,
  ] = useState([]);

  const [quizStatus, setQuizStatus] =
    useState(QUIZ_STATUS.IDLE);

  const [
    timeRemaining,
    setTimeRemaining,
  ] = useState(0);

  const [startedAt, setStartedAt] =
    useState(null);

  const [expiresAt, setExpiresAt] =
    useState(null);

  const [result, setResult] =
    useState(null);

  const [error, setError] =
    useState(null);

  const [config, setConfigState] =
    useState(DEFAULT_QUIZ_CONFIG);

  /*
   * Restore persisted quiz state once.
   */
  useEffect(() => {
    const stored =
      loadStoredState();

    if (!stored) {
      return;
    }

    setQuizState(stored.quiz);
    setQuestions(stored.questions);
    setCurrentQuestionIndex(
      stored.currentQuestionIndex
    );
    setAnswers(stored.answers);
    setMarkedQuestions(
      stored.markedQuestions
    );
    setQuizStatus(
      stored.quizStatus
    );
    setTimeRemaining(
      stored.timeRemaining
    );
    setStartedAt(
      stored.startedAt
    );
    setExpiresAt(
      stored.expiresAt
    );
    setResult(stored.result);
    setError(null);

    setConfigState(
      normalizeConfig(
        stored.quiz?.config
      )
    );
  }, []);

  /*
   * Keep timer state synchronized with
   * the absolute expiration deadline.
   *
   * The deadline is the source of truth,
   * not the persisted decrement value.
   */
  useEffect(() => {
    if (
      quizStatus !==
        QUIZ_STATUS.IN_PROGRESS ||
      !expiresAt
    ) {
      return;
    }

    const syncRemaining = () => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (expiresAt - Date.now()) /
            1000
        )
      );

      setTimeRemaining(
        remaining
      );

      if (remaining <= 0) {
        setQuizStatus(
          QUIZ_STATUS.COMPLETED
        );
      }
    };

    syncRemaining();

    const handleVisibility =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          syncRemaining();
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    window.addEventListener(
      "focus",
      syncRemaining
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );

      window.removeEventListener(
        "focus",
        syncRemaining
      );
    };
  }, [
    quizStatus,
    expiresAt,
  ]);

  /*
   * Persist only serializable quiz state.
   */
  useEffect(() => {
    if (!isBrowser()) {
      return;
    }

    try {
      const stateToStore = {
        quiz,
        questions,
        currentQuestionIndex,
        answers,
        markedQuestions,
        quizStatus,
        timeRemaining,
        startedAt,
        expiresAt,
        result,
        config,
      };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          stateToStore
        )
      );
    } catch {
      // Persistence failure must not break the quiz.
    }
  }, [
    quiz,
    questions,
    currentQuestionIndex,
    answers,
    markedQuestions,
    quizStatus,
    timeRemaining,
    startedAt,
    expiresAt,
    result,
    config,
  ]);

  /*
   * Set complete quiz object.
   */
  const setQuiz = useCallback(
    (nextQuiz) => {
      if (!nextQuiz) {
        setQuizState(null);
        return;
      }

      setQuizState(nextQuiz);

      if (nextQuiz.config) {
        setConfigState(
          normalizeConfig(
            nextQuiz.config
          )
        );
      }

      if (
        Array.isArray(
          nextQuiz.questions
        )
      ) {
        const normalized =
          normalizeQuestions(
            nextQuiz.questions
          );

        setQuestions(
          normalized
        );
      }

      setResult(null);
      setError(null);
    },
    []
  );

  /*
   * Update quiz configuration.
   */
  const setQuizConfig = useCallback(
    (nextConfig) => {
      setConfigState(
        (previous) =>
          normalizeConfig({
            ...previous,
            ...(typeof nextConfig ===
            "function"
              ? nextConfig(previous)
              : nextConfig),
          })
      );

      setError(null);
    },
    []
  );

  /*
   * Start a generated quiz.
   */
  const startQuiz = useCallback(
    (quizData = null) => {
      const source =
        quizData || quiz;

      const nextQuestions =
        normalizeQuestions(
          quizData?.questions ||
            questions
        );

      if (
        nextQuestions.length === 0
      ) {
        setError(
          "Cannot start a quiz without questions."
        );

        setQuizStatus(
          QUIZ_STATUS.ERROR
        );

        return false;
      }

      const nextConfig =
        normalizeConfig(
          quizData?.config ||
            config
        );

      const now = Date.now();

      const deadline =
        nextConfig.duration > 0
          ? now +
            nextConfig.duration *
              1000
          : null;

      setQuizState(
        quizData || source
      );

      setQuestions(
        nextQuestions
      );

      setConfigState(
        nextConfig
      );

      setCurrentQuestionIndex(0);
      setAnswers({});
      setMarkedQuestions([]);
      setResult(null);
      setError(null);

      setStartedAt(now);
      setExpiresAt(deadline);

      setTimeRemaining(
        nextConfig.duration
      );

      setQuizStatus(
        QUIZ_STATUS.IN_PROGRESS
      );

      return true;
    },
    [
      quiz,
      questions,
      config,
    ]
  );

  /*
   * Set current question safely.
   */
  const setCurrentQuestion = useCallback(
    (index) => {
      if (
        questions.length === 0
      ) {
        return false;
      }

      const nextIndex = clamp(
        Number(index),
        0,
        questions.length - 1
      );

      setCurrentQuestionIndex(
        nextIndex
      );

      return true;
    },
    [questions.length]
  );

  const nextQuestion = useCallback(
    () => {
      if (
        currentQuestionIndex >=
        questions.length - 1
      ) {
        return false;
      }

      setCurrentQuestionIndex(
        (previous) =>
          Math.min(
            previous + 1,
            questions.length - 1
          )
      );

      return true;
    },
    [
      currentQuestionIndex,
      questions.length,
    ]
  );

  const previousQuestion =
    useCallback(() => {
      if (
        currentQuestionIndex <= 0
      ) {
        return false;
      }

      setCurrentQuestionIndex(
        (previous) =>
          Math.max(
            previous - 1,
            0
          )
      );

      return true;
    }, [
      currentQuestionIndex,
    ]);

  /*
   * Store an answer.
   */
  const answerQuestion = useCallback(
    (questionId, answer) => {
      if (!questionId) {
        return false;
      }

      if (
        quizStatus !==
          QUIZ_STATUS.IN_PROGRESS &&
        quizStatus !==
          QUIZ_STATUS.READY
      ) {
        return false;
      }

      let normalizedAnswer =
        answer;

      if (
        typeof normalizedAnswer ===
        "string"
      ) {
        normalizedAnswer =
          normalizedAnswer.slice(
            0,
            MAX_ANSWER_LENGTH
          );
      }

      setAnswers(
        (previous) => ({
          ...previous,
          [questionId]:
            normalizedAnswer,
        })
      );

      return true;
    },
    [quizStatus]
  );

  const clearAnswer = useCallback(
    (questionId) => {
      if (!questionId) {
        return false;
      }

      setAnswers(
        (previous) => {
          const next = {
            ...previous,
          };

          delete next[
            questionId
          ];

          return next;
        }
      );

      return true;
    },
    []
  );

  /*
   * Mark/unmark question.
   */
  const toggleQuestionMark =
    useCallback(
      (questionId) => {
        if (!questionId) {
          return false;
        }

        setMarkedQuestions(
          (previous) => {
            if (
              previous.includes(
                questionId
              )
            ) {
              return previous.filter(
                (id) =>
                  id !== questionId
              );
            }

            return [
              ...previous,
              questionId,
            ];
          }
        );

        return true;
      },
      []
    );

  const isQuestionMarked =
    useCallback(
      (questionId) =>
        markedQuestions.includes(
          questionId
        ),
      [markedQuestions]
    );

  /*
   * Timer update.
   */
  const updateTimeRemaining =
    useCallback(
      (seconds) => {
        const next = Math.max(
          0,
          Math.floor(
            Number(seconds) || 0
          )
        );

        setTimeRemaining(next);

        if (
          next === 0 &&
          quizStatus ===
            QUIZ_STATUS.IN_PROGRESS
        ) {
          setQuizStatus(
            QUIZ_STATUS.COMPLETED
          );
        }

        return next;
      },
      [quizStatus]
    );

  /*
   * Compatibility helper.
   *
   * Normal timer operation should remain
   * deadline-based through useTimer.js.
   */
  const decrementTimer =
    useCallback(() => {
      if (
        quizStatus !==
        QUIZ_STATUS.IN_PROGRESS
      ) {
        return 0;
      }

      const next =
        Math.max(
          0,
          timeRemaining - 1
        );

      updateTimeRemaining(
        next
      );

      return next;
    }, [
      quizStatus,
      timeRemaining,
      updateTimeRemaining,
    ]);

  /*
   * Submission lock.
   */
  const beginSubmission =
    useCallback(() => {
      if (
        quizStatus !==
        QUIZ_STATUS.IN_PROGRESS
      ) {
        return false;
      }

      setQuizStatus(
        QUIZ_STATUS.SUBMITTING
      );

      return true;
    }, [quizStatus]);

  /*
   * Store final result.
   */
  const submitQuiz = useCallback(
    (nextResult) => {
      if (
        quizStatus !==
          QUIZ_STATUS.SUBMITTING &&
        quizStatus !==
          QUIZ_STATUS.IN_PROGRESS
      ) {
        return false;
      }

      setResult(
        nextResult || null
      );

      setQuizStatus(
        QUIZ_STATUS.COMPLETED
      );

      setTimeRemaining(0);
      setExpiresAt(null);
      setError(null);

      return true;
    },
    [quizStatus]
  );

  /*
   * Expire quiz exactly once.
   */
  const expireQuiz = useCallback(() => {
    if (
      quizStatus ===
        QUIZ_STATUS.COMPLETED ||
      quizStatus ===
        QUIZ_STATUS.SUBMITTING
    ) {
      return false;
    }

    setTimeRemaining(0);
    setExpiresAt(null);

    setQuizStatus(
      QUIZ_STATUS.SUBMITTING
    );

    return true;
  }, [quizStatus]);

  /*
   * Error handling.
   */
  const setErrorState =
    useCallback(
      (message) => {
        setError(
          message
            ? String(message)
            : "An unknown quiz error occurred."
        );

        setQuizStatus(
          QUIZ_STATUS.ERROR
        );
      },
      []
    );

  const clearError = useCallback(
    () => {
      setError(null);

      if (
        quizStatus ===
        QUIZ_STATUS.ERROR
      ) {
        setQuizStatus(
          questions.length
            ? QUIZ_STATUS.READY
            : QUIZ_STATUS.IDLE
        );
      }
    },
    [
      quizStatus,
      questions.length,
    ]
  );

  /*
   * Reset active quiz while keeping
   * configuration.
   */
  const resetQuiz = useCallback(
    () => {
      setQuizState(null);
      setQuestions([]);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setMarkedQuestions([]);
      setQuizStatus(
        QUIZ_STATUS.IDLE
      );
      setTimeRemaining(0);
      setStartedAt(null);
      setExpiresAt(null);
      setResult(null);
      setError(null);
    },
    []
  );

  /*
   * Completely clear quiz state,
   * including persisted state.
   */
  const clearQuiz = useCallback(
    () => {
      resetQuiz();

      if (isBrowser()) {
        try {
          localStorage.removeItem(
            STORAGE_KEY
          );
        } catch {
          // Ignore storage failures.
        }
      }
    },
    [resetQuiz]
  );

  /*
   * Find question by ID.
   */
  const getQuestion = useCallback(
    (questionId) =>
      questions.find(
        (question) =>
          question.id ===
          questionId
      ) || null,
    [questions]
  );

  /*
   * Get answer by question ID.
   */
  const getAnswer = useCallback(
    (questionId) =>
      Object.prototype.hasOwnProperty.call(
        answers,
        questionId
      )
        ? answers[questionId]
        : undefined,
    [answers]
  );

  const currentQuestion =
    questions[
      currentQuestionIndex
    ] || null;

  const answeredCount =
    Object.keys(answers).filter(
      (questionId) =>
        questions.some(
          (question) =>
            question.id ===
            questionId
        ) &&
        answers[questionId] !==
          undefined &&
        answers[questionId] !==
          null &&
        String(
          answers[questionId]
        ).trim() !== ""
    ).length;

  const unansweredCount =
    Math.max(
      questions.length -
        answeredCount,
      0
    );

  const markedCount =
    markedQuestions.length;

  const isFirstQuestion =
    currentQuestionIndex === 0;

  const isLastQuestion =
    questions.length > 0 &&
    currentQuestionIndex ===
      questions.length - 1;

  const isQuizActive =
    quizStatus ===
      QUIZ_STATUS.IN_PROGRESS ||
    quizStatus ===
      QUIZ_STATUS.SUBMITTING;

  const isCompleted =
    quizStatus ===
    QUIZ_STATUS.COMPLETED;

  const isSubmitting =
    quizStatus ===
    QUIZ_STATUS.SUBMITTING;

  const value = useMemo(
    () => ({
      /*
       * State
       */
      quiz,
      questions,
      config,

      currentQuestionIndex,
      currentQuestion,

      answers,
      markedQuestions,

      quizStatus,
      timeRemaining,

      startedAt,
      expiresAt,

      result,
      error,

      /*
       * Derived state
       */
      answeredCount,
      unansweredCount,
      markedCount,

      isFirstQuestion,
      isLastQuestion,

      isQuizActive,
      isCompleted,
      isSubmitting,

      /*
       * Quiz setup
       */
      setQuiz,
      setQuizConfig,
      startQuiz,

      /*
       * Navigation
       */
      setCurrentQuestion,
      nextQuestion,
      previousQuestion,

      /*
       * Answers
       */
      answerQuestion,
      clearAnswer,
      getAnswer,

      /*
       * Marking
       */
      toggleQuestionMark,
      isQuestionMarked,

      /*
       * Timer
       */
      updateTimeRemaining,
      decrementTimer,

      /*
       * Submission
       */
      beginSubmission,
      submitQuiz,
      expireQuiz,

      /*
       * Errors
       */
      setError: setErrorState,
      clearError,

      /*
       * Reset
       */
      resetQuiz,
      clearQuiz,

      /*
       * Lookup
       */
      getQuestion,
    }),
    [
      quiz,
      questions,
      config,
      currentQuestionIndex,
      currentQuestion,
      answers,
      markedQuestions,
      quizStatus,
      timeRemaining,
      startedAt,
      expiresAt,
      result,
      error,
      answeredCount,
      unansweredCount,
      markedCount,
      isFirstQuestion,
      isLastQuestion,
      isQuizActive,
      isCompleted,
      isSubmitting,
      setQuiz,
      setQuizConfig,
      startQuiz,
      setCurrentQuestion,
      nextQuestion,
      previousQuestion,
      answerQuestion,
      clearAnswer,
      getAnswer,
      toggleQuestionMark,
      isQuestionMarked,
      updateTimeRemaining,
      decrementTimer,
      beginSubmission,
      submitQuiz,
      expireQuiz,
      setErrorState,
      clearError,
      resetQuiz,
      clearQuiz,
      getQuestion,
    ]
  );

  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuizContext = () => {
  const context =
    useContext(QuizContext);

  if (!context) {
    throw new Error(
      "useQuizContext must be used inside QuizProvider."
    );
  }

  return context;
};

export default QuizContext;
