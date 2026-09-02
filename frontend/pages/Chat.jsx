import {
  Bot,
  FileText,
  Image,
  Menu,
  Mic,
  Paperclip,
  Plus,
  Send,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

const initialMessages = [
  {
    id: 1,
    role: "assistant",
    text: "Hello! I'm Gemma, your local AI study assistant. What would you like to learn today?",
  },
];

const suggestions = [
  "Explain DBMS in simple language",
  "What is normalization?",
  "Explain TCP congestion control",
  "Create 5 MCQs on computer networks",
];

function Chat() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [showHistory, setShowHistory] = useState(true);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const sendMessage = (messageText = input) => {
    const text = messageText.trim();

    if (!text || isTyping) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: "user",
      text,
      file: attachedFile
        ? {
            name: attachedFile.name,
            type: attachedFile.type,
          }
        : null,
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setAttachedFile(null);
    setIsTyping(true);

    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: generateResponse(text),
      };

      setMessages((previous) => [...previous, aiMessage]);
      setIsTyping(false);
    }, 900);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const handleSuggestion = (suggestion) => {
    sendMessage(suggestion);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setAttachedFile(file);
  };

  const removeAttachment = () => {
    setAttachedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearChat = () => {
    setMessages(initialMessages);
    setInput("");
    setAttachedFile(null);
  };

  const handleTextareaChange = (event) => {
    setInput(event.target.value);

    const textarea = event.target;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] overflow-hidden">
      {/* =========================================================
          CHAT PAGE ATMOSPHERE
      ========================================================== */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Teal soft glow */}
        <div
          className="absolute left-[15%] top-[12%] h-[420px] w-[420px] rounded-full blur-[150px]"
          style={{
            background: "rgba(13,148,136,0.07)",
          }}
        />

        {/* Cyan soft glow */}
        <div
          className="absolute right-[10%] top-[30%] h-[360px] w-[360px] rounded-full blur-[150px]"
          style={{
            background: "rgba(20,184,166,0.05)",
          }}
        />
      </div>

      {/* =========================================================
          CHAT HISTORY
      ========================================================== */}
      <aside
        className={`relative z-20 flex w-[280px] shrink-0 flex-col border-r border-teal-100/[0.08] bg-[#061214]/75 backdrop-blur-2xl transition-all duration-300 ${
          showHistory ? "translate-x-0" : "-translate-x-full"
        } ${
          showHistory
            ? "fixed inset-y-[80px] left-0 lg:relative lg:inset-y-0"
            : "fixed -left-[280px] inset-y-[80px] lg:relative lg:left-0"
        }`}
      >
        {/* History Header */}
        <div className="flex items-center justify-between border-b border-teal-100/[0.08] px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-white">
              Chat History
            </p>

            <p className="mt-0.5 text-[10px] text-slate-500">
              Your local conversations
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowHistory(false)}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/[0.05] hover:text-white lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* New Chat */}
        <div className="p-3">
          <button
            type="button"
            onClick={clearChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal-300/15 bg-teal-400/[0.06] px-3 py-2.5 text-xs font-medium text-teal-200 transition hover:border-teal-300/25 hover:bg-teal-400/[0.10]"
          >
            <Plus size={15} />
            New Chat
          </button>
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto px-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.035] p-3">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-teal-300/15 bg-teal-400/[0.06]">
                <Bot size={14} className="text-teal-300" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium text-slate-200">
                  New study conversation
                </p>

                <p className="mt-1 text-[9px] text-slate-500">
                  Just now
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Local Info */}
        <div className="border-t border-teal-100/[0.08] p-3">
          <div className="rounded-xl border border-teal-300/10 bg-teal-400/[0.035] p-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-300 shadow-[0_0_8px_rgba(45,212,191,0.7)]" />

              <span className="text-[10px] font-medium text-teal-200">
                Local & Private
              </span>
            </div>

            <p className="mt-2 text-[9px] leading-4 text-slate-500">
              Your conversations are designed to stay on your local AI
              environment.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {showHistory && (
        <button
          type="button"
          aria-label="Close chat history"
          onClick={() => setShowHistory(false)}
          className="fixed inset-0 z-10 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* =========================================================
          MAIN CHAT AREA
      ========================================================== */}
      <section className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* Chat Header */}
        <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-teal-100/[0.08] bg-[#061214]/55 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-2 text-slate-300 transition hover:border-teal-300/20 hover:bg-teal-400/[0.05] hover:text-teal-200 lg:hidden"
            >
              <Menu size={17} />
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-300/15 bg-teal-400/[0.06]">
              <Bot size={18} className="text-teal-300" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-white">
                  AI Chat
                </h1>

                <span className="rounded-full border border-teal-300/15 bg-teal-400/[0.06] px-2 py-0.5 text-[8px] font-medium uppercase tracking-wider text-teal-200">
                  Gemma
                </span>
              </div>

              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                <span className="text-[9px] text-slate-500">
                  Local AI ready
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={clearChat}
            className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-[10px] text-slate-400 transition hover:border-red-300/15 hover:bg-red-400/[0.04] hover:text-red-300"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">
              Clear Chat
            </span>
          </button>
        </header>

        {/* =====================================================
            MESSAGES
        ====================================================== */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
            {messages.length === 1 && (
              <div className="mb-5 flex flex-col items-center justify-center py-8 text-center">
                <div className="relative mb-5">
                  <div className="absolute -inset-5 rounded-full bg-teal-400/[0.06] blur-2xl" />

                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-300/15 bg-[#07181a]/90 shadow-[0_0_50px_rgba(20,184,166,0.08)]">
                    <Bot
                      size={29}
                      strokeWidth={1.5}
                      className="text-teal-200"
                    />
                  </div>
                </div>

                <h2 className="text-xl font-semibold text-white">
                  Ask Gemma
                </h2>

                <p className="mt-2 max-w-md text-xs leading-6 text-slate-400">
                  Ask questions, understand difficult concepts, or use
                  your study material to learn with your local AI.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
              />
            ))}

            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-300/15 bg-teal-400/[0.06]">
                  <Bot size={17} className="text-teal-300" />
                </div>

                <div className="rounded-2xl rounded-tl-md border border-teal-100/[0.08] bg-[#071416]/80 px-4 py-3 backdrop-blur-xl">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-300" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-300 [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-300 [animation-delay:240ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =====================================================
            SUGGESTIONS
        ====================================================== */}
        {messages.length === 1 && (
          <div className="mx-auto w-full max-w-4xl px-4 pb-3 sm:px-6 lg:px-8">
            <div className="grid gap-2 sm:grid-cols-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestion(suggestion)}
                  className="rounded-xl border border-teal-100/[0.07] bg-black/20 px-3 py-2.5 text-left text-[10px] text-slate-400 backdrop-blur-xl transition hover:border-teal-300/15 hover:bg-teal-400/[0.04] hover:text-teal-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================
            ATTACHMENT PREVIEW
        ====================================================== */}
        {attachedFile && (
          <div className="mx-auto w-full max-w-4xl px-4 pb-2 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 rounded-xl border border-teal-300/10 bg-teal-400/[0.035] px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-400/[0.07]">
                {attachedFile.type.startsWith("image/") ? (
                  <Image
                    size={15}
                    className="text-teal-300"
                  />
                ) : (
                  <FileText
                    size={15}
                    className="text-teal-300"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-medium text-slate-200">
                  {attachedFile.name}
                </p>

                <p className="text-[9px] text-slate-500">
                  Ready to attach
                </p>
              </div>

              <button
                type="button"
                onClick={removeAttachment}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* =====================================================
            INPUT
        ====================================================== */}
        <div className="border-t border-teal-100/[0.08] bg-[#050b0d]/70 px-4 py-4 backdrop-blur-2xl sm:px-6">
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-4xl"
          >
            <div className="relative rounded-2xl border border-teal-100/[0.10] bg-[#071214]/85 shadow-[0_15px_50px_rgba(0,0,0,0.25)] backdrop-blur-xl transition focus-within:border-teal-300/20">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask Gemma anything..."
                rows={1}
                disabled={isTyping}
                className="block max-h-[150px] min-h-[54px] w-full resize-none bg-transparent px-4 pb-12 pt-4 pr-14 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 disabled:cursor-not-allowed"
              />

              {/* Bottom Controls */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {/* Attachment */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isTyping}
                    title="Attach file"
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-teal-400/[0.06] hover:text-teal-300 disabled:opacity-40"
                  >
                    <Paperclip size={16} />
                  </button>

                  {/* Mic */}
                  <button
                    type="button"
                    disabled={isTyping}
                    title="Voice input"
                    onClick={() =>
                      alert(
                        "Voice input will be connected later.",
                      )
                    }
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-teal-400/[0.06] hover:text-teal-300 disabled:opacity-40"
                  >
                    <Mic size={16} />
                  </button>
                </div>

                {/* Send */}
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 text-teal-200 transition hover:bg-teal-500/25 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>

            <p className="mt-2 text-center text-[8px] text-slate-600">
              OFFSEDU · Local AI · Gemma · Ollama
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}

function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-start gap-3 ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
          isUser
            ? "border-white/10 bg-white/[0.06]"
            : "border-teal-300/15 bg-teal-400/[0.06]"
        }`}
      >
        {isUser ? (
          <User
            size={17}
            className="text-slate-300"
          />
        ) : (
          <Bot
            size={17}
            className="text-teal-300"
          />
        )}
      </div>

      {/* Message */}
      <div
        className={`max-w-[85%] sm:max-w-[75%] ${
          isUser ? "text-right" : ""
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-3 text-xs leading-6 backdrop-blur-xl ${
            isUser
              ? "rounded-tr-md border border-teal-300/10 bg-teal-400/[0.07] text-slate-200"
              : "rounded-tl-md border border-white/[0.07] bg-black/25 text-slate-300"
          }`}
        >
          <p className="whitespace-pre-wrap">
            {message.text}
          </p>

          {message.file && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-2.5 py-2 text-left">
              <FileText
                size={14}
                className="shrink-0 text-teal-300"
              />

              <span className="truncate text-[9px] text-slate-400">
                {message.file.name}
              </span>
            </div>
          )}
        </div>

        <p
          className={`mt-1.5 text-[8px] text-slate-600 ${
            isUser ? "mr-1" : "ml-1"
          }`}
        >
          {isUser ? "You" : "Gemma"}
        </p>
      </div>
    </div>
  );
}

function generateResponse(message) {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("dbms") ||
    lowerMessage.includes("database")
  ) {
    return "A DBMS, or Database Management System, is software used to store, organize, retrieve and manage data efficiently. Examples include MySQL, PostgreSQL and Oracle Database. Think of it as a system that helps applications safely work with structured data.";
  }

  if (
    lowerMessage.includes("normalization") ||
    lowerMessage.includes("normal form")
  ) {
    return "Database normalization is a process of organizing data to reduce redundancy and improve data integrity. Common normal forms include 1NF, 2NF, 3NF and BCNF. Each level applies additional rules to the structure of tables.";
  }

  if (
    lowerMessage.includes("tcp") ||
    lowerMessage.includes("congestion")
  ) {
    return "TCP congestion control manages how much data can be sent through a network without overwhelming it. Important mechanisms include Slow Start, Congestion Avoidance, Fast Retransmit and Fast Recovery.";
  }

  if (
    lowerMessage.includes("mcq") ||
    lowerMessage.includes("quiz")
  ) {
    return "Sure. I can help you practice with MCQs. For example, you can ask me for 10 DBMS questions at medium difficulty, and the quiz engine can later generate them from your study material.";
  }

  return "That's a good study question. Once the local Gemma backend is connected, OFFSEDU will generate a detailed answer using your local AI model and can also use your uploaded study material when document processing and RAG are connected.";
}

export default Chat;