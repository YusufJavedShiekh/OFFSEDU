import { useState } from "react";
import {
  Plus,
  Send,
  Paperclip,
  Mic,
  Trash2,
  MessageCircle,
  Bot,
  User,
} from "lucide-react";

function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState(["New Conversation"]);

  const sendMessage = () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) return;

    const newMessage = {
      id: Date.now(),
      text: trimmedMessage,
      sender: "user",
    };

    setMessages((previous) => [...previous, newMessage]);
    setMessage("");

    // Temporary frontend-only AI response
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        text: "I'm OFFSEDU AI. Once the backend is connected, I will generate a real response using your local Gemma model.",
        sender: "ai",
      };

      setMessages((previous) => [...previous, aiMessage]);
    }, 700);
  };

  const createNewChat = () => {
    setMessages([]);
    setMessage("");

    setChats((previous) => [
      ...previous,
      `Conversation ${previous.length + 1}`,
    ]);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] bg-[#05070d] text-white">

      {/* Chat History */}
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#080b13] md:flex md:flex-col">

        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div>
            <h2 className="text-sm font-semibold">Chat History</h2>
            <p className="mt-1 text-xs text-slate-500">
              Your conversations
            </p>
          </div>

          <button
            type="button"
            onClick={createNewChat}
            className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            title="New Chat"
          >
            <Plus size={17} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {chats.map((chat, index) => (
            <button
              key={`${chat}-${index}`}
              type="button"
              className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <MessageCircle size={17} />

              <span className="truncate">
                {chat}
              </span>
            </button>
          ))}
        </div>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={clearChat}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 transition hover:bg-white/5 hover:text-red-400"
          >
            <Trash2 size={17} />
            Clear Current Chat
          </button>
        </div>
      </aside>

      {/* Main Chat */}
      <section className="flex min-w-0 flex-1 flex-col">

        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <Bot size={21} />
            </div>

            <div>
              <h1 className="text-sm font-semibold sm:text-base">
                OFFSEDU AI
              </h1>

              <div className="mt-0.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-400" />

                <span className="text-xs text-slate-500">
                  Local AI Assistant
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={createNewChat}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white sm:text-sm"
          >
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          {messages.length === 0 ? (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="max-w-xl text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <Bot size={30} className="text-slate-300" />
                </div>

                <h2 className="mt-6 text-2xl font-bold sm:text-3xl">
                  How can I help you study?
                </h2>

                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
                  Ask questions, understand difficult concepts,
                  summarize topics, or get help with your studies.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">

                  {[
                    "Explain DBMS in simple words",
                    "What is TCP/IP?",
                    "Create a study plan",
                    "Explain operating systems",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setMessage(suggestion)}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left text-sm text-slate-400 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}

                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl space-y-6">

              {messages.map((item) => (
                <div
                  key={item.id}
                  className={`flex gap-3 ${
                    item.sender === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  {item.sender === "ai" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-black">
                      <Bot size={18} />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      item.sender === "user"
                        ? "bg-white text-black"
                        : "border border-white/10 bg-white/[0.04] text-slate-300"
                    }`}
                  >
                    {item.text}
                  </div>

                  {item.sender === "user" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                      <User size={18} />
                    </div>
                  )}

                </div>
              ))}

            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 p-4 sm:p-6">
          <div className="mx-auto max-w-4xl">

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 focus-within:border-white/20">

              <div className="flex items-end gap-2">

                <button
                  type="button"
                  className="rounded-xl p-3 text-slate-500 transition hover:bg-white/5 hover:text-white"
                  title="Attach File"
                >
                  <Paperclip size={19} />
                </button>

                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Ask OFFSEDU AI anything..."
                  className="max-h-32 min-h-12 flex-1 resize-none bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-slate-600"
                />

                <button
                  type="button"
                  className="rounded-xl p-3 text-slate-500 transition hover:bg-white/5 hover:text-white"
                  title="Voice Input"
                >
                  <Mic size={19} />
                </button>

                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  className="rounded-xl bg-white p-3 text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
                  title="Send Message"
                >
                  <Send size={18} />
                </button>

              </div>

            </div>

            <p className="mt-3 text-center text-xs text-slate-600">
              OFFSEDU runs locally. Your conversations stay on your device.
            </p>

          </div>
        </div>

      </section>
    </div>
  );
}

export default Chat;