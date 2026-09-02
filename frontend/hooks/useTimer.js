import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useQuizContext } from "../context/QuizContext";

const DEFAULT_LOW_TIME_THRESHOLD = 60;
const DEFAULT_CRITICAL_TIME_THRESHOLD = 10;

const QUIZ_STATUS = {
  IN_PROGRESS: "IN_PROGRESS",
};

const clampSeconds = (value) => {
  const seconds = Number(value);

  if (!Number.isFinite(seconds)) {
    return 0;
  }

  return Math.max(0, Math.floor(seconds));
};

const getTimestamp = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : null;
  }

  const timestamp =
    new Date(value).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : null;
};

const formatTime = (totalSeconds) => {
  const seconds =
    clampSeconds(totalSeconds);

  const hours =
    Math.floor(seconds / 3600);

  const minutes =
    Math.floor(
      (seconds % 3600) / 60
    );

  const remainingSeconds =
    seconds % 60;

  if (hours > 0) {
    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(remainingSeconds).padStart(
        2,
        "0"
      ),
    ].join(":");
  }

  return [
    String(minutes).padStart(2, "0"),
    String(remainingSeconds).padStart(
      2,
      "0"
    ),
  ].join(":");
};

export const useTimer = ({
  lowTimeThreshold =
    DEFAULT_LOW_TIME_THRESHOLD,

  criticalTimeThreshold =
    DEFAULT_CRITICAL_TIME_THRESHOLD,

  onExpire,
} = {}) => {
  const {
    quizStatus,
    timeRemaining,
    startedAt,
    expiresAt,
    updateTimeRemaining,
    decrementTimer,
  } = useQuizContext();

  const intervalRef =
    useRef(null);

  const mountedRef =
    useRef(false);

  const expirationHandledRef =
    useRef(false);

  const expirationCallbackRef =
    useRef(onExpire);

  const expiresAtRef =
    useRef(expiresAt);

  const timeRemainingRef =
    useRef(timeRemaining);

  const quizStatusRef =
    useRef(quizStatus);

  const [isRunning, setIsRunning] =
    useState(false);

  /*
   * Keep mutable values in refs so the
   * timer interval does not need to be
   * recreated every second.
   */
  useEffect(() => {
    expirationCallbackRef.current =
      onExpire;
  }, [onExpire]);

  useEffect(() => {
    expiresAtRef.current =
      expiresAt;
  }, [expiresAt]);

  useEffect(() => {
    timeRemainingRef.current =
      timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    quizStatusRef.current =
      quizStatus;
  }, [quizStatus]);

  /*
   * Mount/unmount lifecycle.
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (intervalRef.current) {
        clearInterval(
          intervalRef.current
        );

        intervalRef.current = null;
      }
    };
  }, []);

  /*
   * Stop internal interval.
   */
  const stopInterval =
    useCallback(() => {
      if (intervalRef.current) {
        clearInterval(
          intervalRef.current
        );

        intervalRef.current = null;
      }

      if (mountedRef.current) {
        setIsRunning(false);
      }

      return true;
    }, []);

  /*
   * Calculate remaining time from the
   * absolute deadline.
   *
   * expiresAt is the source of truth.
   */
  const calculateRemaining =
    useCallback(() => {
      const deadline =
        getTimestamp(
          expiresAtRef.current
        );

      if (!deadline) {
        return clampSeconds(
          timeRemainingRef.current
        );
      }

      const remainingMilliseconds =
        deadline - Date.now();

      return clampSeconds(
        Math.ceil(
          remainingMilliseconds / 1000
        )
      );
    }, []);

  /*
   * Handle expiration exactly once.
   */
  const handleExpiration =
    useCallback(() => {
      if (
        expirationHandledRef.current
      ) {
        return false;
      }

      expirationHandledRef.current =
        true;

      stopInterval();

      if (mountedRef.current) {
        timeRemainingRef.current = 0;

        updateTimeRemaining(0);
      }

      const callback =
        expirationCallbackRef.current;

      if (
        typeof callback === "function"
      ) {
        callback();
      }

      return true;
    }, [
      stopInterval,
      updateTimeRemaining,
    ]);

  /*
   * Synchronize context time with the
   * absolute deadline.
   */
  const syncTimer =
    useCallback(() => {
      if (
        quizStatusRef.current !==
        QUIZ_STATUS.IN_PROGRESS
      ) {
        return 0;
      }

      const remaining =
        calculateRemaining();

      if (remaining <= 0) {
        handleExpiration();
        return 0;
      }

      if (
        mountedRef.current &&
        remaining !==
          timeRemainingRef.current
      ) {
        timeRemainingRef.current =
          remaining;

        updateTimeRemaining(
          remaining
        );
      }

      return remaining;
    }, [
      calculateRemaining,
      handleExpiration,
      updateTimeRemaining,
    ]);

  /*
   * Start the timer.
   *
   * Only one interval can exist.
   */
  const start =
    useCallback(() => {
      if (
        quizStatusRef.current !==
        QUIZ_STATUS.IN_PROGRESS
      ) {
        return false;
      }

      /*
       * If a new active quiz/deadline is
       * starting, allow expiration again.
       */
      if (
        timeRemainingRef.current > 0
      ) {
        expirationHandledRef.current =
          false;
      }

      const remaining =
        syncTimer();

      if (remaining <= 0) {
        return false;
      }

      /*
       * Prevent duplicate intervals.
       */
      if (intervalRef.current) {
        if (mountedRef.current) {
          setIsRunning(true);
        }

        return true;
      }

      intervalRef.current =
        setInterval(() => {
          if (!mountedRef.current) {
            return;
          }

          if (
            quizStatusRef.current !==
            QUIZ_STATUS.IN_PROGRESS
          ) {
            stopInterval();
            return;
          }

          const current =
            syncTimer();

          if (current <= 0) {
            stopInterval();
          }
        }, 1000);

      if (mountedRef.current) {
        setIsRunning(true);
      }

      return true;
    }, [
      syncTimer,
      stopInterval,
    ]);

  /*
   * Stop timer.
   */
  const stop =
    useCallback(() => {
      return stopInterval();
    }, [stopInterval]);

  /*
   * Pause timer behavior.
   *
   * Important:
   * The absolute expiresAt deadline
   * is NOT modified.
   *
   * Therefore this is an interval pause,
   * not a true deadline pause.
   */
  const pause =
    useCallback(() => {
      stopInterval();
      return true;
    }, [stopInterval]);

  /*
   * Resume using the original deadline.
   */
  const resume =
    useCallback(() => {
      if (
        quizStatusRef.current !==
        QUIZ_STATUS.IN_PROGRESS
      ) {
        return false;
      }

      return start();
    }, [start]);

  /*
   * Reset expiration guard.
   */
  const resetExpiration =
    useCallback(() => {
      expirationHandledRef.current =
        false;

      return true;
    }, []);

  /*
   * Manually set remaining time.
   *
   * Normally expiresAt should remain
   * authoritative.
   */
  const setRemainingTime =
    useCallback(
      (seconds) => {
        const value =
          clampSeconds(seconds);

        timeRemainingRef.current =
          value;

        updateTimeRemaining(value);

        if (value <= 0) {
          handleExpiration();
        }

        return value;
      },
      [
        updateTimeRemaining,
        handleExpiration,
      ]
    );

  /*
   * Compatibility helper.
   *
   * Normal timer operation does NOT use
   * decrementTimer as its source of truth.
   */
  const tick =
    useCallback(() => {
      if (
        quizStatusRef.current !==
        QUIZ_STATUS.IN_PROGRESS
      ) {
        return false;
      }

      const remaining =
        calculateRemaining();

      if (remaining <= 0) {
        handleExpiration();
        return false;
      }

      /*
       * Keep compatibility with QuizContext.
       * Deadline-based synchronization remains
       * authoritative.
       */
      decrementTimer();

      return true;
    }, [
      calculateRemaining,
      handleExpiration,
      decrementTimer,
    ]);

  /*
   * Format current remaining time.
   */
  const formattedTime =
    formatTime(timeRemaining);

  /*
   * Format arbitrary duration.
   */
  const format =
    useCallback((seconds) => {
      return formatTime(seconds);
    }, []);

  const normalizedLowThreshold =
    clampSeconds(
      lowTimeThreshold
    );

  const normalizedCriticalThreshold =
    clampSeconds(
      criticalTimeThreshold
    );

  const isExpired =
    timeRemaining <= 0;

  const isLowTime =
    !isExpired &&
    timeRemaining <=
      normalizedLowThreshold;

  const isCriticalTime =
    !isExpired &&
    timeRemaining <=
      normalizedCriticalThreshold;

  const hasStarted =
    Boolean(startedAt);

  /*
   * Detect deadline changes.
   *
   * A new expiresAt represents a new
   * timer lifecycle.
   */
  const previousExpiresAtRef =
    useRef(expiresAt);

  useEffect(() => {
    const previous =
      previousExpiresAtRef.current;

    if (previous !== expiresAt) {
      previousExpiresAtRef.current =
        expiresAt;

      expirationHandledRef.current =
        false;

      expiresAtRef.current =
        expiresAt;

      /*
       * Synchronize immediately when the
       * deadline changes and the quiz is active.
       */
      if (
        quizStatusRef.current ===
        QUIZ_STATUS.IN_PROGRESS
      ) {
        syncTimer();
      }
    }
  }, [
    expiresAt,
    syncTimer,
  ]);

  /*
   * Automatically start/synchronize the
   * timer whenever an active quiz exists.
   */
  useEffect(() => {
    if (
      quizStatus !==
      QUIZ_STATUS.IN_PROGRESS
    ) {
      stopInterval();
      return undefined;
    }

    /*
     * Synchronize immediately after:
     * - quiz start
     * - page refresh
     * - state restoration
     * - deadline change
     */
    const remaining =
      syncTimer();

    if (remaining <= 0) {
      return undefined;
    }

    /*
     * Start only if not already running.
     */
    if (!intervalRef.current) {
      intervalRef.current =
        setInterval(() => {
          if (!mountedRef.current) {
            return;
          }

          if (
            quizStatusRef.current !==
            QUIZ_STATUS.IN_PROGRESS
          ) {
            stopInterval();
            return;
          }

          const current =
            syncTimer();

          if (current <= 0) {
            stopInterval();
          }
        }, 1000);

      setIsRunning(true);
    }

    return undefined;
  }, [
    quizStatus,
    expiresAt,
    syncTimer,
    stopInterval,
  ]);

  /*
   * Browser tab visibility handling.
   *
   * Browsers may throttle timers in
   * background tabs, so recalculate from
   * expiresAt when the page becomes visible.
   */
  useEffect(() => {
    if (
      typeof document === "undefined"
    ) {
      return undefined;
    }

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          syncTimer();
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [syncTimer]);

  /*
   * Window focus handling.
   */
  useEffect(() => {
    if (
      typeof window === "undefined"
    ) {
      return undefined;
    }

    const handleFocus = () => {
      syncTimer();
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [syncTimer]);

  return {
    /*
     * Current timer state
     */
    timeRemaining,
    formattedTime,

    /*
     * Quiz timing metadata
     */
    startedAt,
    expiresAt,

    /*
     * State flags
     */
    isRunning,
    isExpired,
    isLowTime,
    isCriticalTime,
    hasStarted,

    /*
     * Timer controls
     */
    start,
    stop,
    pause,
    resume,

    /*
     * Synchronization
     */
    syncTimer,
    setRemainingTime,
    resetExpiration,

    /*
     * Compatibility tick
     */
    tick,

    /*
     * Formatting
     */
    format,

    /*
     * Thresholds
     */
    lowTimeThreshold:
      normalizedLowThreshold,

    criticalTimeThreshold:
      normalizedCriticalThreshold,
  };
};

export default useTimer;
