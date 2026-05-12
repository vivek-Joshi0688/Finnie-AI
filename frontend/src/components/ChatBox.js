import { useState, useRef, useEffect } from "react";
import axios from "axios";
import Message from "./Message";

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

function SidebarToggleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="9" y1="3" x2="9" y2="21"/>
    </svg>
  );
}

export default function ChatBox({ messages, onAddMessage, onToggleSidebar }) {
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);
  const textareaRef           = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    onAddMessage({ role: "user", text });
    setInput("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await axios.post("http://localhost:8001/chat/", null, { params: { query: text } });
      onAddMessage({ role: "assistant", text: res.data.response, agent: res.data.intent || "ai", steps: res.data.steps || [] });
    } catch {
      onAddMessage({ role: "assistant", text: "Something went wrong. Please try again.", agent: "fallback" });
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const onInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)", background: "var(--bg-card)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button
          onClick={onToggleSidebar}
          title="Toggle history"
          style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--fg-muted)", padding: "0.3rem", borderRadius: "0.4rem", display: "flex", alignItems: "center", flexShrink: 0, transition: "color 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
        >
          <SidebarToggleIcon />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--fg)" }}>Finnie AI</h1>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--fg-muted)" }}>
            Ask about markets, portfolio, or financial insights
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1rem" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>

          {messages.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "48vh", textAlign: "center", gap: "0.75rem" }}>
              <div style={{ width: 54, height: 54, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "1rem", color: "var(--fg)" }}>Start a conversation</p>
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.83rem", color: "var(--fg-muted)" }}>Ask about stocks, portfolio, or financial insights</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => <Message key={i} msg={msg} />)}

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div style={{ display: "flex", gap: "0.3rem", padding: "0.55rem 0.85rem", background: "var(--bubble-b)", borderRadius: "1rem 1rem 1rem 0.25rem", border: "1px solid var(--border)" }}>
                {[0, 150, 300].map((delay) => (
                  <span key={delay} className="dot-bounce" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--fg-muted)", display: "inline-block", animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: "0.75rem 1rem 1rem", borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", gap: "0.6rem", alignItems: "flex-end" }}>
          <textarea
            ref={textareaRef}
            rows={1}
            className="t-input"
            style={{ flex: 1, lineHeight: 1.5 }}
            value={input}
            onChange={onInput}
            onKeyDown={onKeyDown}
            placeholder="Message Finnie AI…"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            style={{
              background: input.trim() && !loading ? "var(--accent)" : "var(--border)",
              color: input.trim() && !loading ? "#fff" : "var(--fg-muted)",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.6rem 1rem",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontWeight: 600,
              fontSize: "0.85rem",
              whiteSpace: "nowrap",
              transition: "background 0.15s, color 0.15s",
              flexShrink: 0,
            }}
          >
            <SendIcon />
            Send
          </button>
        </div>
        <p style={{ margin: "0.35rem 0 0", textAlign: "center", fontSize: "0.7rem", color: "var(--fg-muted)" }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
