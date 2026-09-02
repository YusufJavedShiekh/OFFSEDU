import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ChatContext = createContext(null);

const STORAGE_KEY = "offsedu_chat_state";

const MAX_CONVERSATIONS = 50;
const MAX_MESSAGES_PER_CONVERSATION = 200;
const MAX_MESSAGE_LENGTH = 20000;

export const MESSAGE_ROLES = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
};

export const MESSAGE_STATUS = {
  SENDING: "sending",
  SENT: "sent",
  STREAMING: "streaming",
  ERROR: "error",
};

const VALID_ROLES = Object.values(MESSAGE_ROLES);
const VALID_STATUSES = Object.values(MESSAGE_STATUS);

/**
 * Generate a unique ID.
 */
const generateId = (prefix = "id") => {
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

/**
 * Generate a conversation title from the first
 * user message.
 */
const generateConversationTitle = (content) => {
  const text = String(content || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return "New Chat";
  }

  if (text.length <= 50) {
    return text;
  }

  return `${text.slice(0, 50).trim()}…`;
};

/**
 * Normalize a message.
 */
const normalizeMessage = (message) => {
  if (!message || typeof message !== "object") {
    return null;
  }

  const role = VALID_ROLES.includes(message.role)
    ? message.role
    : MESSAGE_ROLES.ASSISTANT;

  const status = VALID_STATUSES.includes(
    message.status
  )
    ? message.status
    : MESSAGE_STATUS.SENT;

  return {
    id: message.id || generateId("message"),
    role,
    content:
      typeof message.content === "string"
        ? message.content
        : String(message.content || ""),
    timestamp:
      message.timestamp ||
      new Date().toISOString(),
    status,
    metadata:
      message.metadata &&
      typeof message.metadata === "object"
        ? message.metadata
        : {},
  };
};

/**
 * Normalize a conversation.
 */
const normalizeConversation = (
  conversation
) => {
  if (
    !conversation ||
    typeof conversation !== "object"
  ) {
    return null;
  }

  const messages = Array.isArray(
    conversation.messages
  )
    ? conversation.messages
        .map(normalizeMessage)
        .filter(Boolean)
        .slice(
          -MAX_MESSAGES_PER_CONVERSATION
        )
    : [];

  return {
    id:
      conversation.id ||
      generateId("conversation"),

    title:
      typeof conversation.title === "string" &&
      conversation.title.trim()
        ? conversation.title.trim()
        : "New Chat",

    messages,

    createdAt:
      conversation.createdAt ||
      new Date().toISOString(),

    updatedAt:
      conversation.updatedAt ||
      new Date().toISOString(),

    metadata:
      conversation.metadata &&
      typeof conversation.metadata === "object"
        ? conversation.metadata
        : {},
  };
};

/**
 * Safely load chat state.
 */
const loadStoredState = () => {
  try {
    const stored =
      localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return {
        conversations: [],
        activeConversationId: null,
      };
    }

    const parsed = JSON.parse(stored);

    if (
      !parsed ||
      typeof parsed !== "object"
    ) {
      throw new Error("Invalid chat state.");
    }

    const conversations = Array.isArray(
      parsed.conversations
    )
      ? parsed.conversations
          .map(normalizeConversation)
          .filter(Boolean)
          .slice(0, MAX_CONVERSATIONS)
      : [];

    const activeConversationId =
      typeof parsed.activeConversationId ===
      "string"
        ? parsed.activeConversationId
        : null;

    return {
      conversations,
      activeConversationId,
    };
  } catch {
    return {
      conversations: [],
      activeConversationId: null,
    };
  }
};

export const ChatProvider = ({ children }) => {
  const initialState = useMemo(
    () => loadStoredState(),
    []
  );

  const [conversations, setConversations] =
    useState(initialState.conversations);

  const [
    activeConversationId,
    setActiveConversationId,
  ] = useState(
    initialState.activeConversationId
  );

  const [isTyping, setIsTyping] =
    useState(false);

  const [isStreaming, setIsStreaming] =
    useState(false);

  const [error, setErrorState] =
    useState(null);

  /**
   * Persist conversations.
   */
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          conversations,
          activeConversationId,
        })
      );
    } catch {
      // Storage failure should not break chat.
    }
  }, [
    conversations,
    activeConversationId,
  ]);

  /**
   * Ensure active conversation always exists.
   */
  useEffect(() => {
    if (
      activeConversationId &&
      !conversations.some(
        (conversation) =>
          conversation.id ===
          activeConversationId
      )
    ) {
      setActiveConversationId(
        conversations[0]?.id || null
      );
    }
  }, [
    conversations,
    activeConversationId,
  ]);

  /**
   * Active conversation.
   */
  const activeConversation = useMemo(() => {
    return (
      conversations.find(
        (conversation) =>
          conversation.id ===
          activeConversationId
      ) || null
    );
  }, [
    conversations,
    activeConversationId,
  ]);

  /**
   * Active conversation messages.
   */
  const messages = useMemo(() => {
    return activeConversation?.messages || [];
  }, [activeConversation]);

  /**
   * Create a conversation.
   */
  const createConversation = useCallback(
    (options = {}) => {
      const now =
        new Date().toISOString();

      const conversation = {
        id: generateId("conversation"),

        title:
          typeof options.title === "string" &&
          options.title.trim()
            ? options.title.trim()
            : "New Chat",

        messages: [],

        createdAt: now,
        updatedAt: now,

        metadata:
          options.metadata &&
          typeof options.metadata === "object"
            ? options.metadata
            : {},
      };

      setConversations((previous) => [
        conversation,
        ...previous,
      ].slice(0, MAX_CONVERSATIONS));

      setActiveConversationId(
        conversation.id
      );

      setErrorState(null);

      return conversation;
    },
    []
  );

  /**
   * Select a conversation.
   */
  const selectConversation = useCallback(
    (conversationId) => {
      const exists = conversations.some(
        (conversation) =>
          conversation.id === conversationId
      );

      if (!exists) {
        setErrorState(
          "Conversation not found."
        );
        return false;
      }

      setActiveConversationId(
        conversationId
      );

      setErrorState(null);

      return true;
    },
    [conversations]
  );

  /**
   * Rename a conversation.
   */
  const renameConversation = useCallback(
    (conversationId, title) => {
      const cleanTitle = String(
        title || ""
      )
        .replace(/\s+/g, " ")
        .trim();

      if (!cleanTitle) {
        setErrorState(
          "Conversation title cannot be empty."
        );
        return false;
      }

      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                title:
                  cleanTitle.slice(0, 100),
                updatedAt:
                  new Date().toISOString(),
              }
            : conversation
        )
      );

      return true;
    },
    []
  );

  /**
   * Delete a conversation.
   */
  const deleteConversation = useCallback(
    (conversationId) => {
      const index =
        conversations.findIndex(
          (conversation) =>
            conversation.id ===
            conversationId
        );

      if (index === -1) {
        setErrorState(
          "Conversation not found."
        );
        return false;
      }

      const remaining =
        conversations.filter(
          (conversation) =>
            conversation.id !==
            conversationId
        );

      setConversations(remaining);

      if (
        activeConversationId ===
        conversationId
      ) {
        const nextConversation =
          remaining[index] ||
          remaining[index - 1] ||
          remaining[0] ||
          null;

        setActiveConversationId(
          nextConversation?.id || null
        );
      }

      setIsTyping(false);
      setIsStreaming(false);

      return true;
    },
    [
      conversations,
      activeConversationId,
    ]
  );

  /**
   * Add a message to a conversation.
   */
  const addMessage = useCallback(
    (
      message,
      conversationId = activeConversationId
    ) => {
      if (!conversationId) {
        setErrorState(
          "No active conversation."
        );
        return null;
      }

      if (
        !message ||
        typeof message !== "object"
      ) {
        setErrorState(
          "Invalid message."
        );
        return null;
      }

      if (
        !VALID_ROLES.includes(message.role)
      ) {
        setErrorState(
          "Invalid message role."
        );
        return null;
      }

      const content = String(
        message.content || ""
      );

      if (
        content.length >
        MAX_MESSAGE_LENGTH
      ) {
        setErrorState(
          "Message is too long."
        );
        return null;
      }

      const newMessage = normalizeMessage({
        ...message,
        id:
          message.id ||
          generateId("message"),
        content,
        status:
          message.status ||
          MESSAGE_STATUS.SENT,
      });

      if (!newMessage) {
        return null;
      }

      setConversations((previous) =>
        previous.map((conversation) => {
          if (
            conversation.id !==
            conversationId
          ) {
            return conversation;
          }

          const nextMessages = [
            ...conversation.messages,
            newMessage,
          ].slice(
            -MAX_MESSAGES_PER_CONVERSATION
          );

          let title =
            conversation.title;

          if (
            conversation.messages.length ===
              0 &&
            newMessage.role ===
              MESSAGE_ROLES.USER
          ) {
            title =
              generateConversationTitle(
                newMessage.content
              );
          }

          return {
            ...conversation,
            title,
            messages: nextMessages,
            updatedAt:
              new Date().toISOString(),
          };
        })
      );

      return newMessage;
    },
    [activeConversationId]
  );

  /**
   * Update a message.
   */
  const updateMessage = useCallback(
    (
      messageId,
      updates,
      conversationId = activeConversationId
    ) => {
      if (!messageId || !conversationId) {
        return false;
      }

      let updated = false;

      setConversations((previous) =>
        previous.map((conversation) => {
          if (
            conversation.id !==
            conversationId
          ) {
            return conversation;
          }

          const messages =
            conversation.messages.map(
              (message) => {
                if (
                  message.id !== messageId
                ) {
                  return message;
                }

                updated = true;

                const next = {
                  ...message,
                  ...updates,
                };

                if (
                  updates.status &&
                  !VALID_STATUSES.includes(
                    updates.status
                  )
                ) {
                  next.status =
                    message.status;
                }

                if (
                  typeof updates.content ===
                  "string"
                ) {
                  next.content =
                    updates.content.slice(
                      0,
                      MAX_MESSAGE_LENGTH
                    );
                }

                next.updatedAt =
                  new Date().toISOString();

                return next;
              }
            );

          return {
            ...conversation,
            messages,
            updatedAt:
              new Date().toISOString(),
          };
        })
      );

      return updated;
    },
    [activeConversationId]
  );

  /**
   * Append content to a message.
   *
   * Useful for streamed AI responses.
   */
  const appendToMessage = useCallback(
    (
      messageId,
      chunk,
      conversationId = activeConversationId
    ) => {
      if (
        !messageId ||
        !conversationId ||
        chunk === undefined ||
        chunk === null
      ) {
        return false;
      }

      let updated = false;

      setConversations((previous) =>
        previous.map((conversation) => {
          if (
            conversation.id !==
            conversationId
          ) {
            return conversation;
          }

          const messages =
            conversation.messages.map(
              (message) => {
                if (
                  message.id !== messageId
                ) {
                  return message;
                }

                updated = true;

                const nextContent =
                  `${message.content || ""}${String(
                    chunk
                  )}`.slice(
                    0,
                    MAX_MESSAGE_LENGTH
                  );

                return {
                  ...message,
                  content: nextContent,
                  status:
                    MESSAGE_STATUS.STREAMING,
                  updatedAt:
                    new Date().toISOString(),
                };
              }
            );

          return {
            ...conversation,
            messages,
            updatedAt:
              new Date().toISOString(),
          };
        })
      );

      return updated;
    },
    [activeConversationId]
  );

  /**
   * Remove one message.
   */
  const removeMessage = useCallback(
    (
      messageId,
      conversationId = activeConversationId
    ) => {
      if (!messageId || !conversationId) {
        return false;
      }

      let removed = false;

      setConversations((previous) =>
        previous.map((conversation) => {
          if (
            conversation.id !==
            conversationId
          ) {
            return conversation;
          }

          const messages =
            conversation.messages.filter(
              (message) => {
                if (
                  message.id === messageId
                ) {
                  removed = true;
                  return false;
                }

                return true;
              }
            );

          return {
            ...conversation,
            messages,
            updatedAt:
              new Date().toISOString(),
          };
        })
      );

      return removed;
    },
    [activeConversationId]
  );

  /**
   * Clear messages from a conversation.
   */
  const clearConversation = useCallback(
    (
      conversationId = activeConversationId
    ) => {
      if (!conversationId) {
        return false;
      }

      let cleared = false;

      setConversations((previous) =>
        previous.map((conversation) => {
          if (
            conversation.id !==
            conversationId
          ) {
            return conversation;
          }

          cleared = true;

          return {
            ...conversation,
            messages: [],
            title: "New Chat",
            updatedAt:
              new Date().toISOString(),
          };
        })
      );

      setIsTyping(false);
      setIsStreaming(false);

      return cleared;
    },
    [activeConversationId]
  );

  /**
   * Set typing state.
   */
  const setTyping = useCallback(
    (value) => {
      setIsTyping(Boolean(value));
    },
    []
  );

  /**
   * Set streaming state.
   */
  const setStreaming = useCallback(
    (value) => {
      setIsStreaming(Boolean(value));
    },
    []
  );

  /**
   * Set global chat error.
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
   * Clear error.
   */
  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  /**
   * Find conversation.
   */
  const getConversation = useCallback(
    (conversationId) => {
      return (
        conversations.find(
          (conversation) =>
            conversation.id ===
            conversationId
        ) || null
      );
    },
    [conversations]
  );

  /**
   * Find message.
   */
  const getMessage = useCallback(
    (
      messageId,
      conversationId = activeConversationId
    ) => {
      const conversation =
        conversations.find(
          (item) =>
            item.id === conversationId
        );

      if (!conversation) {
        return null;
      }

      return (
        conversation.messages.find(
          (message) =>
            message.id === messageId
        ) || null
      );
    },
    [
      conversations,
      activeConversationId,
    ]
  );

  /**
   * Reset entire chat state.
   */
  const resetChat = useCallback(() => {
    setConversations([]);
    setActiveConversationId(null);
    setIsTyping(false);
    setIsStreaming(false);
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
   * Context value.
   */
  const value = useMemo(
    () => ({
      // State
      conversations,
      activeConversationId,
      activeConversation,
      messages,
      isTyping,
      isStreaming,
      error,

      // Conversation actions
      createConversation,
      selectConversation,
      renameConversation,
      deleteConversation,
      clearConversation,

      // Message actions
      addMessage,
      updateMessage,
      appendToMessage,
      removeMessage,

      // Chat state
      setTyping,
      setStreaming,

      // Utilities
      getConversation,
      getMessage,

      // Error handling
      setError,
      clearError,

      // Reset
      resetChat,

      // Constants
      messageRoles: MESSAGE_ROLES,
      messageStatuses: MESSAGE_STATUS,
    }),
    [
      conversations,
      activeConversationId,
      activeConversation,
      messages,
      isTyping,
      isStreaming,
      error,
      createConversation,
      selectConversation,
      renameConversation,
      deleteConversation,
      clearConversation,
      addMessage,
      updateMessage,
      appendToMessage,
      removeMessage,
      setTyping,
      setStreaming,
      getConversation,
      getMessage,
      setError,
      clearError,
      resetChat,
    ]
  );

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

/**
 * Access ChatContext.
 */
export const useChat = () => {
  const context =
    useContext(ChatContext);

  if (!context) {
    throw new Error(
      "useChat must be used inside a ChatProvider."
    );
  }

  return context;
};

export default ChatContext;
