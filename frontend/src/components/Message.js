import { useState } from "react";
import AgentBadge from "./AgentBadge";

// ── Per-node colours ──────────────────────────────────────────────────────────
const NODE_COLOR = {
  guardrail:  "#3b82f6",
  off_topic:  "#ef4444",
  router:     "#8b5cf6",
  market:     "#f59e0b",
  portfolio:  "#f59e0b",
  rag:        "#f59e0b",
  news:       "#f59e0b",
  aggregator: "#10b981",
  fallback:   "#6b7280",
};

const NODE_ICON = {
  guardrail:  "🛡",
  off_topic:  "🚫",
  router:     "🔀",
  market:     "📈",
  portfolio:  "💼",
  rag:        "📚",
  news:       "📰",
  aggregator: "✅",
  fallback:   "🤖",
};

// ── Step trace component ──────────────────────────────────────────────────────
function StepTrace({ steps }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!steps?.length) return null;

  return (
    <div style={{ marginBottom: "0.5rem", fontSize: "0.75rem" }}>
      {/* Header row */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          display: "flex", alignItems: "center", gap: "0.35rem",
          background: "transparent", border: "none", cursor: "pointer",
          color: "var(--fg-muted)", padding: "0.1rem 0", marginBottom: collapsed ? 0 : "0.35rem",
          fontSize: "0.72rem", fontWeight: 500,
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        {steps.length} agent step{steps.length !== 1 ? "s" : ""}
      </button>

      {/* Steps */}
      {!collapsed && (
        <div style={{
          borderLeft: "2px solid var(--border)",
          paddingLeft: "0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
        }}>
          {steps.map((step, i) => {
            const color = NODE_COLOR[step.node] || "#6b7280";
            const icon  = NODE_ICON[step.node]  || "•";
            return (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "baseline", gap: "0.45rem",
                  animation: "stepIn 0.25s ease both",
                  animationDelay: `${i * 80}ms`,
                  opacity: 0,  // overridden by animation fill-mode "both"
                }}
              >
                {/* Coloured dot */}
                <span style={{ color, fontSize: "0.8rem", flexShrink: 0, lineHeight: 1 }}>{icon}</span>
                {/* Label */}
                <span style={{ fontWeight: 600, color: "var(--fg)", whiteSpace: "nowrap" }}>{step.label}</span>
                {/* Separator */}
                <span style={{ color: "var(--border)" }}>—</span>
                {/* Detail */}
                <span style={{ color: "var(--fg-muted)" }}>{step.detail}</span>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes stepIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
export default function Message({ msg }) {
  const isUser = msg.role === "user";

  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        gap: "0.3rem", maxWidth: "80%",
      }}>
        {/* Avatar + name */}
        {!isUser && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)", fontWeight: 500 }}>Finnie AI</span>
          </div>
        )}

        {/* Step trace (assistant only) */}
        {!isUser && msg.steps?.length > 0 && <StepTrace steps={msg.steps} />}

        {/* Message bubble */}
        <div
          className={isUser ? "bubble-user" : "bubble-bot"}
          style={{ padding: "0.6rem 0.9rem", fontSize: "0.88rem", lineHeight: 1.6, wordBreak: "break-word", whiteSpace: "pre-wrap" }}
        >
          {msg.text}
        </div>

        {/* Agent badge */}
        {msg.agent && !isUser && <AgentBadge agent={msg.agent} />}
      </div>
    </div>
  );
}
