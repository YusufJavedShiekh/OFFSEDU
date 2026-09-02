import { useCallback, useEffect, useRef, useState } from "react";
import { useChat as useChatContext } from "../context/ChatContext";
import * as chatService from "../services/chatService";

const MAX_MESSAGE_LENGTH = 20000;

const isAbortError = (error) => {
  return (
    error?.name === "AbortError" ||
    error?.code === "ERR_CANCELED" ||
    error?.message?.toLowerCase?.().includes("aborted") ||
    error?.message?.toLowerCase?.().includes("canceled")
  );
};

const extractResponseText = (response) => {
  if (typeof response === "string") {
    return response;
  }

  if (!response || typeof response !== "object") {
    return "";
  }

  return (
    response.message?.content ??
    response.content ??
    response.response ??
    response.text ??
    ""
  );
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

  return "Something went wrong while processing your message.";
};

export const useChat = () => {
  const {
    conversations,
    activeConversation,
    messages,

    isTyping,
    isStreaming,
    error,

    createConversation,
    selectConversation,
    renameConversation,
    deleteConversation,

    addMessage,
    updateMessage,
    appendToMessage,

    setTyping,
    setStreaming,

    setError,
    clearError,

    getConversation,
    getMessage,

    resetChat,
  } = useChatContext();

  const [isSending, setIsSending] =
    useState(false);

  const [isCancelling, setIsCancelling] =
    useState(false);

  const abortControllerRef = useRef(null);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  /**
   * Track whether the hook is mounted.
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  /**
   * Safely update local state only
   * while the hook is mounted.
   */
  const safeSetState = useCallback(
    (callback) => {
      if (mountedRef.current) {
        callback();
      }
    },
    []
  );

  /**
   * Validate message before sending.
   */
  const validateMessage = useCallback(
    (content) => {
      if (typeof content !== "string") {
        return {
          valid: false,
          error: "Message must be text.",
        };
      }

      const trimmed = content.trim();

      if (!trimmed) {
        return {
          valid: false,
          error: "Message cannot be empty.",
        };
      }

      if (
        trimmed.length >
        MAX_MESSAGE_LENGTH
      ) {
        return {
          valid: false,
          error: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
        };
      }

      return {
        valid: true,
        content: trimmed,
      };
    },
    []
  );

  /**
   * Ensure a conversation exists.
   */
  const ensureConversation =
    useCallback(async () => {
      if (activeConversation?.id) {
        return activeConversation;
      }

      const created =
        await createConversation();

      if (!created) {
        throw new Error(
          "Unable to create a conversation."
        );
      }

      return created;
    }, [
      activeConversation,
      createConversation,
    ]);

  /**
   * Create a user message.
   */
  const createUserMessage =
    useCallback(
      (conversationId, content) => {
        const message = {
          id: undefined,
          role: "user",
          content,
          status: "sent",
        };

        return addMessage(
          conversationId,
          message
        );
      },
      [addMessage]
    );

  /**
   * Create an assistant placeholder.
   */
  const createAssistantMessage =
    useCallback(
      (conversationId) => {
        const message = {
          id: undefined,
          role: "assistant",
          content: "",
          status: "streaming",
        };

        return addMessage(
          conversationId,
          message
        );
      },
      [addMessage]
    );

  /**
   * Handle a normal non-streaming response.
   */
  const handleNormalResponse =
    useCallback(
      (
        conversationId,
        assistantMessageId,
        response
      ) => {
        const content =
          extractResponseText(
            response
          );

        updateMessage(
          conversationId,
          assistantMessageId,
          {
            content,
            status: "sent",
          }
        );

        return content;
      },
      [updateMessage]
    );

  /**
   * Handle streaming response.
   *
   * chatService may expose different
   * streaming APIs, so this supports a
   * callback-based stream when available.
   */
  const handleStreamingResponse =
    useCallback(
      async (
        conversationId,
        assistantMessageId,
        streamRequest,
        signal
      ) => {
        let accumulated = "";

        const appendChunk = (
          chunk
        ) => {
          if (!mountedRef.current) {
            return;
          }

          const text =
            typeof chunk === "string"
              ? chunk
              : extractResponseText(
                  chunk
                );

          if (!text) {
            return;
          }

          accumulated += text;

          appendToMessage(
            conversationId,
            assistantMessageId,
            text
          );
        };

        const response =
          await streamRequest({
            signal,
            onChunk: appendChunk,
          });

        /*
         * Some service implementations
         * return the complete response after
         * streaming. Avoid duplicating it if
         * chunks already populated the message.
         */
        if (
          !accumulated &&
          response
        ) {
          accumulated =
            extractResponseText(
              response
            );

          if (accumulated) {
            updateMessage(
              conversationId,
              assistantMessageId,
              {
                content:
                  accumulated,
              }
            );
          }
        }

        updateMessage(
          conversationId,
          assistantMessageId,
          {
            status: "sent",
          }
        );

        return accumulated;
      },
      [
        appendToMessage,
        updateMessage,
      ]
    );

  /**
   * Send a message.
   */
  const sendMessage = useCallback(
    async (
      content,
      options = {}
    ) => {
      const validation =
        validateMessage(content);

      if (!validation.valid) {
        setError(
          validation.error
        );

        return {
          success: false,
          error: validation.error,
        };
      }

      /*
       * Prevent duplicate requests.
       */
      if (isSending) {
        return {
          success: false,
          error:
            "A message is already being processed.",
        };
      }

      const requestId =
        ++requestIdRef.current;

      const controller =
        new AbortController();

      abortControllerRef.current =
        controller;

      safeSetState(() => {
        setIsSending(true);
        setIsCancelling(false);
      });

      clearError();

      let conversation = null;
      let userMessage = null;
      let assistantMessage = null;

      try {
        conversation =
          await ensureConversation();

        if (
          controller.signal.aborted
        ) {
          throw new DOMException(
            "Request aborted.",
            "AbortError"
          );
        }

        const conversationId =
          conversation.id;

        /*
         * Add user message first.
         */
        userMessage =
          createUserMessage(
            conversationId,
            validation.content
          );

        if (!userMessage) {
          throw new Error(
            "Unable to add your message."
          );
        }

        /*
         * Create assistant placeholder.
         */
        assistantMessage =
          createAssistantMessage(
            conversationId
          );

        if (!assistantMessage) {
          throw new Error(
            "Unable to create assistant response."
          );
        }

        const assistantMessageId =
          assistantMessage.id;

        setTyping(true);
        setStreaming(
          Boolean(options.stream)
        );

        /*
         * Streaming path.
         */
        if (
          options.stream &&
          typeof chatService.streamMessage ===
            "function"
        ) {
          await handleStreamingResponse(
            conversationId,
            assistantMessageId,
            ({ signal, onChunk }) =>
              chatService.streamMessage(
                {
                  conversationId,
                  message:
                    validation.content,
                  messages:
                    messages || [],
                  ...options,
                },
                {
                  signal,
                  onChunk,
                }
              ),
            controller.signal
          );
        } else {
          /*
           * Normal request path.
           */
          if (
            typeof chatService.sendMessage !==
            "function"
          ) {
            throw new Error(
              "chatService.sendMessage is not available."
            );
          }

          const response =
            await chatService.sendMessage(
              {
                conversationId,
                message:
                  validation.content,
                messages:
                  messages || [],
                ...options,
              },
              {
                signal:
                  controller.signal,
              }
            );

          if (
            controller.signal.aborted
          ) {
            throw new DOMException(
              "Request aborted.",
              "AbortError"
            );
          }

          handleNormalResponse(
            conversationId,
            assistantMessageId,
            response
          );
        }

        if (
          requestId !==
          requestIdRef.current
        ) {
          return {
            success: false,
            cancelled: true,
          };
        }

        safeSetState(() => {
          setTyping(false);
          setStreaming(false);
        });

        return {
          success: true,
          conversationId:
            conversation.id,
          userMessage,
          assistantMessageId,
        };
      } catch (requestError) {
        const cancelled =
          isAbortError(requestError) ||
          controller.signal.aborted;

        /*
         * User cancellation is not treated
         * as an API failure.
         */
        if (cancelled) {
          if (
            assistantMessage &&
            conversation?.id
          ) {
            updateMessage(
              conversation.id,
              assistantMessage.id,
              {
                status: "sent",
              }
            );
          }

          return {
            success: false,
            cancelled: true,
          };
        }

        const message =
          normalizeError(
            requestError
          );

        /*
         * Mark assistant response as failed.
         */
        if (
          assistantMessage &&
          conversation?.id
        ) {
          updateMessage(
            conversation.id,
            assistantMessage.id,
            {
              status: "error",
              error: message,
            }
          );
        }

        setError(message);

        return {
          success: false,
          error: message,
        };
      } finally {
        if (
          requestId ===
          requestIdRef.current
        ) {
          abortControllerRef.current =
            null;

          safeSetState(() => {
            setIsSending(false);
            setIsCancelling(false);
            setTyping(false);
            setStreaming(false);
          });
        }
      }
    },
    [
      isSending,
      validateMessage,
      setError,
      clearError,
      ensureConversation,
      safeSetState,
      createUserMessage,
      createAssistantMessage,
      setTyping,
      setStreaming,
      messages,
      handleStreamingResponse,
      handleNormalResponse,
      updateMessage,
    ]
  );

  /**
   * Stop the active generation.
   */
  const stopGeneration =
    useCallback(() => {
      const controller =
        abortControllerRef.current;

      if (!controller) {
        return false;
      }

      safeSetState(() => {
        setIsCancelling(true);
      });

      controller.abort();

      return true;
    }, [safeSetState]);

  /**
   * Retry a failed assistant message.
   */
  const retryMessage =
    useCallback(
      async (
        messageId,
        options = {}
      ) => {
        const message =
          getMessage(messageId);

        if (!message) {
          setError(
            "Message not found."
          );

          return {
            success: false,
          };
        }

        if (
          message.role !==
          "assistant"
        ) {
          setError(
            "Only assistant messages can be retried."
          );

          return {
            success: false,
          };
        }

        const conversation =
          getConversation(
            activeConversation?.id
          );

        if (!conversation) {
          setError(
            "Conversation not found."
          );

          return {
            success: false,
          };
        }

        const conversationMessages =
          conversation.messages ||
          [];

        const assistantIndex =
          conversationMessages.findIndex(
            (item) =>
              item.id === messageId
          );

        if (
          assistantIndex === -1
        ) {
          setError(
            "Unable to locate the failed response."
          );

          return {
            success: false,
          };
        }

        /*
         * Find the nearest previous user
         * message to retry.
         */
        let userMessage = null;

        for (
          let index =
            assistantIndex - 1;
          index >= 0;
          index -= 1
        ) {
          if (
            conversationMessages[
              index
            ]?.role === "user"
          ) {
            userMessage =
              conversationMessages[
                index
              ];
            break;
          }
        }

        if (!userMessage?.content) {
          setError(
            "No user message is available for retry."
          );

          return {
            success: false,
          };
        }

        updateMessage(
          conversation.id,
          messageId,
          {
            content: "",
            status: "streaming",
            error: null,
          }
        );

        /*
         * Remove the failed placeholder
         * logically by requesting a new response.
         *
         * The existing conversation remains
         * intact.
         */
        return sendMessage(
          userMessage.content,
          {
            ...options,
            conversationId:
              conversation.id,
            retryMessageId:
              messageId,
          }
        );
      },
      [
        getMessage,
        getConversation,
        activeConversation,
        setError,
        updateMessage,
        sendMessage,
      ]
    );

  /**
   * Rename conversation.
   */
  const rename = useCallback(
    (conversationId, title) => {
      const trimmed =
        typeof title === "string"
          ? title.trim()
          : "";

      if (!trimmed) {
        setError(
          "Conversation title cannot be empty."
        );
        return false;
      }

      return renameConversation(
        conversationId,
        trimmed
      );
    },
    [
      renameConversation,
      setError,
    ]
  );

  /**
   * Cancel any active request.
   */
  const cancelRequest =
    useCallback(() => {
      return stopGeneration();
    }, [stopGeneration]);

  return {
    /*
     * State
     */
    conversations,
    activeConversation,
    messages,

    isTyping,
    isStreaming,
    isSending,
    isCancelling,

    error,

    /*
     * Messaging
     */
    sendMessage,
    retryMessage,
    stopGeneration,
    cancelRequest,

    /*
     * Conversations
     */
    createConversation,
    selectConversation,
    renameConversation: rename,
    deleteConversation,

    /*
     * Context utilities
     */
    getConversation,
    getMessage,

    /*
     * Error handling
     */
    setError,
    clearError,

    /*
     * Reset
     */
    resetChat,
  };
};

export default useChat;
