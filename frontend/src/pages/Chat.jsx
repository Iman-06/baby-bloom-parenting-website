import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Flower2, Home, ClipboardPlus, MessageCircle, User, LogOut,
  Send, Plus, Sparkles,
} from "lucide-react";
import { getMe } from "../api/auth";
import { sendMessage, getChatHistory } from "../api/chat";

// ── sidebar nav ──────────────────────────────────────────────
const navItems = [
  { name: "Dashboard",    icon: Home,          href: "/dashboard",    active: false },
  { name: "Log Activity", icon: ClipboardPlus, href: "/log-activity", active: false },
  { name: "AI Chat",      icon: MessageCircle, href: "/chat",         active: true  },
  { name: "Profile",      icon: User,          href: "/profile",      active: false },
];

// ── quick-start prompts ───────────────────────────────────────
const PROMPTS = [
  "How much should a 3-month-old sleep?",
  "Is 37.8 °C a fever for a newborn?",
  "How many feedings per day at 6 months?",
  "My baby won't stop crying — what should I do?",
];

export default function ChatPage() {
  const navigate   = useNavigate();
  const bottomRef  = useRef(null);
  const textareaRef = useRef(null);

  const [user,           setUser]           = useState(null);
  const [sessions,       setSessions]       = useState([]);
  const [activeSession,  setActiveSession]  = useState(null); // { id, title, messages[] }
  const [input,          setInput]          = useState("");
  const [sending,        setSending]        = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  // ── load user + history ────────────────────────────────────
  useEffect(() => {
    getMe()
      .then((u) => {
        setUser(u);
        return getChatHistory(u.id);
      })
      .then(setSessions)
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  // ── scroll to bottom on message changes ───────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages]);

  // ── auto-resize textarea ───────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [input]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  function startNewChat() {
    setActiveSession({ id: null, title: "New Chat", messages: [] });
  }

  function openSession(session) {
    setActiveSession({
      id:       session.id,
      title:    session.title,
      messages: session.messages || [],
    });
  }

  async function handleSend(text) {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;

    // optimistic user message
    const userBubble = { role: "user", content: msg };
    setActiveSession((prev) => ({
      ...(prev || { id: null, title: "New Chat", messages: [] }),
      messages: [...(prev?.messages || []), userBubble],
    }));
    setInput("");
    setSending(true);

    try {
      const data = await sendMessage({
        message:    msg,
        session_id: activeSession?.id || undefined,
      });

      const assistantBubble = { role: "assistant", content: data.reply };
      setActiveSession((prev) => ({
        id:       data.session_id,
        title:    data.session_title,
        messages: [...(prev?.messages || []), assistantBubble],
      }));

      // refresh sidebar history
      if (user) getChatHistory(user.id).then(setSessions).catch(() => {});

    } catch (err) {
      const detail = err?.response?.data?.detail || "Something went wrong.";
      setActiveSession((prev) => ({
        ...prev,
        messages: [
          ...(prev?.messages || []),
          { role: "assistant", content: `⚠️ ${detail}`, error: true },
        ],
      }));
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const messages = activeSession?.messages || [];

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── App sidebar ── */}
      <aside className="w-64 bg-white border-r border-[oklch(0.94_0.02_340)] fixed left-0 top-0 h-full flex flex-col z-20">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[oklch(0.85_0.08_340)] to-[oklch(0.82_0.08_230)]" />
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[oklch(0.88_0.08_340)] to-[oklch(0.85_0.08_230)] flex items-center justify-center">
                <Flower2 className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[oklch(0.78_0.1_230)]" />
            </div>
            <span className="text-xl font-bold text-[oklch(0.45_0.08_340)]" style={{ fontFamily: "var(--font-display)" }}>
              Baby Bloom
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    item.active
                      ? "bg-gradient-to-r from-[oklch(0.95_0.03_340)] to-[oklch(0.95_0.03_230)] text-[oklch(0.45_0.08_340)] font-medium"
                      : "text-muted-foreground hover:bg-[oklch(0.97_0.01_340)] hover:text-[oklch(0.45_0.08_340)]"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${item.active ? "text-[oklch(0.65_0.1_340)]" : ""}`} />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-[oklch(0.94_0.02_340)]">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[oklch(0.6_0.08_340)] hover:bg-[oklch(0.96_0.03_340)] hover:text-[oklch(0.5_0.1_340)] transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Chat area (takes up rest of screen after app sidebar) ── */}
      <div className="flex-1 ml-64 flex">

        {/* Chat history panel */}
        <div className="w-56 bg-white border-r border-[oklch(0.94_0.02_340)] flex flex-col shrink-0">
          <div className="p-4 border-b border-[oklch(0.94_0.02_340)]">
            <button
              type="button"
              onClick={startNewChat}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[oklch(0.8_0.1_340)] via-[oklch(0.78_0.09_300)] to-[oklch(0.78_0.1_230)] text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {historyLoading && (
              <p className="text-xs text-muted-foreground text-center mt-6">Loading…</p>
            )}
            {!historyLoading && sessions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center mt-6 px-3 leading-relaxed">
                No chats yet — start a conversation!
              </p>
            )}
            {sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => openSession(s)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${
                  activeSession?.id === s.id
                    ? "bg-gradient-to-r from-[oklch(0.95_0.03_340)] to-[oklch(0.95_0.03_230)] text-[oklch(0.45_0.08_340)] font-medium"
                    : "text-muted-foreground hover:bg-[oklch(0.97_0.01_340)] hover:text-[oklch(0.45_0.08_340)]"
                }`}
              >
                <p className="text-sm truncate">{s.title || "Chat"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Main message window */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Header */}
          <div className="bg-white border-b border-[oklch(0.94_0.02_340)] px-6 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[oklch(0.88_0.08_340)] to-[oklch(0.85_0.08_230)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-[oklch(0.35_0.05_340)]" style={{ fontFamily: "var(--font-display)" }}>
                {activeSession?.title || "BabyBloom Assistant"}
              </h1>
              <p className="text-xs text-muted-foreground">Powered by AI · General guidance only</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">

            {/* Empty state */}
            {!activeSession && (
              <div className="flex flex-col items-center justify-center h-full text-center pb-16">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[oklch(0.92_0.04_340)] to-[oklch(0.92_0.04_230)] flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-[oklch(0.65_0.1_340)]" />
                </div>
                <h2 className="text-xl font-bold text-[oklch(0.35_0.05_340)] mb-2" style={{ fontFamily: "var(--font-display)" }}>
                  How can I help?
                </h2>
                <p className="text-muted-foreground text-sm mb-6 max-w-xs">
                  Ask me anything about your baby's sleep, feeding, temperature, or wellbeing.
                </p>
                <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                  {PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { startNewChat(); setInput(p); }}
                      className="bg-white border border-[oklch(0.92_0.03_340)] rounded-xl px-3 py-2.5 text-xs text-left text-muted-foreground hover:border-[oklch(0.78_0.1_340)] hover:text-[oklch(0.45_0.08_340)] hover:bg-[oklch(0.98_0.01_340)] transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {/* Assistant avatar */}
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[oklch(0.88_0.08_340)] to-[oklch(0.85_0.08_230)] flex items-center justify-center shrink-0 mb-0.5">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-[oklch(0.8_0.1_340)] to-[oklch(0.78_0.1_230)] text-white rounded-br-sm"
                      : msg.error
                      ? "bg-[oklch(0.97_0.03_30)] text-[oklch(0.4_0.1_30)] border border-[oklch(0.9_0.06_30)] rounded-bl-sm"
                      : "bg-white text-foreground border border-[oklch(0.94_0.02_340)] shadow-sm rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>

                {/* User avatar */}
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-[oklch(0.92_0.03_340)] flex items-center justify-center shrink-0 mb-0.5">
                    <User className="w-4 h-4 text-[oklch(0.65_0.1_340)]" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {sending && (
              <div className="flex items-end gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[oklch(0.88_0.08_340)] to-[oklch(0.85_0.08_230)] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-[oklch(0.94_0.02_340)] shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="w-2 h-2 rounded-full bg-[oklch(0.75_0.12_340)] animate-bounce"
                        style={{ animationDelay: `${d * 0.18}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="bg-white border-t border-[oklch(0.94_0.02_340)] px-6 py-4">
            <div className="flex gap-3 items-end">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your baby…"
                className="flex-1 resize-none px-4 py-3 rounded-xl border border-[oklch(0.92_0.03_340)] bg-[oklch(0.99_0.005_340)] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[oklch(0.78_0.1_230)] focus:border-transparent transition-all text-sm overflow-hidden"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={sending || !input.trim()}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-[oklch(0.8_0.1_340)] to-[oklch(0.78_0.1_230)] text-white flex items-center justify-center shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">
              AI guidance only — not a substitute for professional medical advice
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}