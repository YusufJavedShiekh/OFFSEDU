import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AppContext = createContext(null);

const STORAGE_KEYS = {
  LANGUAGE: "offsedu_language",
  THEME: "offsedu_theme",
  EXPLAIN: "offsedu_explain_state",
};

export const LANGUAGES = {
  ENGLISH: "en",
  HINDI: "hi",
  MARATHI: "mr",
  URDU: "ur",
};

export const APP_PAGES = {
  HOME: "home",
  CHAT: "chat",
  EXPLAIN: "explain",
  QUIZ: "quiz",
  TEST_PAPER: "test-paper",
  STUDY_PLAN: "study-plan",
  DOCUMENTS: "documents",
  FILE_TOOLS: "file-tools",
  SETTINGS: "settings",
};

export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

const VALID_LANGUAGES = Object.values(LANGUAGES);
const VALID_THEMES = Object.values(THEMES);

const DEFAULT_EXPLAIN_STATE = {
  subject: "",
  topic: "",
  language: LANGUAGES.ENGLISH,
  level: "Simple",
  file: null,
  documentId: null,
  explanation: "",
  sections: [],
  steps: [],
  visuals: [],
  keyPoints: [],
  examPoints: [],
  terms: [],
};

/**
 * Safely read a value from localStorage.
 */
const getStoredValue = (key, validValues, fallback) => {
  try {
    const value = localStorage.getItem(key);

    return validValues.includes(value)
      ? value
      : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Safely read Explain page state from localStorage.
 */
const getStoredExplainState = () => {
  try {
    const stored = localStorage.getItem(
      STORAGE_KEYS.EXPLAIN
    );

    if (!stored) {
      return DEFAULT_EXPLAIN_STATE;
    }

    const parsed = JSON.parse(stored);

    if (!parsed || typeof parsed !== "object") {
      return DEFAULT_EXPLAIN_STATE;
    }

    return {
      ...DEFAULT_EXPLAIN_STATE,
      ...parsed,
    };
  } catch {
    return DEFAULT_EXPLAIN_STATE;
  }
};

/**
 * Apply the selected theme to the document.
 */
const applyTheme = (theme) => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  const shouldUseDark =
    theme === THEMES.DARK ||
    (theme === THEMES.SYSTEM &&
      typeof window !== "undefined" &&
      window
        .matchMedia(
          "(prefers-color-scheme: dark)"
        )
        .matches);

  root.classList.toggle(
    "dark",
    shouldUseDark
  );

  root.dataset.theme = shouldUseDark
    ? THEMES.DARK
    : THEMES.LIGHT;
};

export const AppProvider = ({ children }) => {
  const [activePage, setActivePageState] =
    useState(APP_PAGES.HOME);

  const [language, setLanguageState] =
    useState(() =>
      getStoredValue(
        STORAGE_KEYS.LANGUAGE,
        VALID_LANGUAGES,
        LANGUAGES.ENGLISH
      )
    );

  const [theme, setThemeState] =
    useState(() =>
      getStoredValue(
        STORAGE_KEYS.THEME,
        VALID_THEMES,
        THEMES.SYSTEM
      )
    );

  const [loading, setLoadingState] =
    useState(false);

  const [error, setErrorState] =
    useState(null);

  /**
   * Persistent Explain page state.
   *
   * This allows Explain data to remain available
   * when navigating between application pages.
   */
  const [explainState, setExplainState] =
    useState(getStoredExplainState);

  /**
   * Apply theme whenever theme changes.
   */
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  /**
   * Follow operating-system theme changes
   * when OFFSEDU is using "system" theme.
   */
  useEffect(() => {
    if (
      theme !== THEMES.SYSTEM ||
      typeof window === "undefined"
    ) {
      return undefined;
    }

    const mediaQuery =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

    const handleThemeChange = () => {
      applyTheme(THEMES.SYSTEM);
    };

    mediaQuery.addEventListener(
      "change",
      handleThemeChange
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleThemeChange
      );
    };
  }, [theme]);

  /**
   * Persist Explain page state.
   */
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.EXPLAIN,
        JSON.stringify(explainState)
      );
    } catch {
      // Continue even if browser storage is unavailable.
    }
  }, [explainState]);

  /**
   * Set active application page.
   */
  const setActivePage = useCallback(
    (page) => {
      if (
        !Object.values(APP_PAGES).includes(page)
      ) {
        setErrorState(
          `Invalid application page: ${page}`
        );

        return false;
      }

      setActivePageState(page);

      return true;
    },
    []
  );

  /**
   * Change application language.
   */
  const setLanguage = useCallback((value) => {
    if (!VALID_LANGUAGES.includes(value)) {
      setErrorState(
        `Unsupported language: ${value}`
      );

      return false;
    }

    setLanguageState(value);

    try {
      localStorage.setItem(
        STORAGE_KEYS.LANGUAGE,
        value
      );
    } catch {
      // Continue even if browser storage is unavailable.
    }

    return true;
  }, []);

  /**
   * Change application theme.
   */
  const setTheme = useCallback((value) => {
    if (!VALID_THEMES.includes(value)) {
      setErrorState(
        `Unsupported theme: ${value}`
      );

      return false;
    }

    setThemeState(value);

    try {
      localStorage.setItem(
        STORAGE_KEYS.THEME,
        value
      );
    } catch {
      // Continue even if browser storage is unavailable.
    }

    return true;
  }, []);

  /**
   * Set global loading state.
   */
  const setLoading = useCallback((value) => {
    setLoadingState(Boolean(value));
  }, []);

  /**
   * Set global error.
   */
  const setError = useCallback((value) => {
    if (!value) {
      setErrorState(null);
      return;
    }

    if (value instanceof Error) {
      setErrorState(value.message);
      return;
    }

    setErrorState(String(value));
  }, []);

  /**
   * Clear global error.
   */
  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  /**
   * Update Explain page state.
   */
  const updateExplainState = useCallback(
    (updates) => {
      setExplainState((previous) => ({
        ...previous,
        ...(typeof updates === "function"
          ? updates(previous)
          : updates),
      }));
    },
    []
  );

  /**
   * Clear Explain page state.
   */
  const clearExplainState = useCallback(() => {
    setExplainState({
      ...DEFAULT_EXPLAIN_STATE,
    });

    try {
      localStorage.removeItem(
        STORAGE_KEYS.EXPLAIN
      );
    } catch {
      // Ignore storage errors.
    }
  }, []);

  /**
   * Reset global application state.
   */
  const resetApp = useCallback(() => {
    setActivePageState(APP_PAGES.HOME);
    setLanguageState(LANGUAGES.ENGLISH);
    setThemeState(THEMES.SYSTEM);
    setLoadingState(false);
    setErrorState(null);

    setExplainState({
      ...DEFAULT_EXPLAIN_STATE,
    });

    try {
      localStorage.setItem(
        STORAGE_KEYS.LANGUAGE,
        LANGUAGES.ENGLISH
      );

      localStorage.setItem(
        STORAGE_KEYS.THEME,
        THEMES.SYSTEM
      );

      localStorage.removeItem(
        STORAGE_KEYS.EXPLAIN
      );
    } catch {
      // Ignore storage errors.
    }
  }, []);

  /**
   * Context value.
   */
  const value = useMemo(
    () => ({
      // Global state
      activePage,
      language,
      theme,
      loading,
      error,

      // Explain page state
      explainState,

      // Constants
      languages: LANGUAGES,
      pages: APP_PAGES,
      themes: THEMES,

      // Actions
      setActivePage,
      setLanguage,
      setTheme,
      setLoading,
      setError,
      clearError,

      // Explain actions
      setExplainState,
      updateExplainState,
      clearExplainState,

      resetApp,
    }),
    [
      activePage,
      language,
      theme,
      loading,
      error,
      explainState,
      setActivePage,
      setLanguage,
      setTheme,
      setLoading,
      setError,
      clearError,
      updateExplainState,
      clearExplainState,
      resetApp,
    ]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Access AppContext.
 */
export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "useApp must be used inside an AppProvider."
    );
  }

  return context;
};

export default AppContext;