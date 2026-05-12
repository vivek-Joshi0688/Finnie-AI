const BADGE = {
  market:    { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "Market Agent"    },
  portfolio: { bg: "rgba(139,92,246,0.15)", color: "#8b5cf6", label: "Portfolio Agent" },
  rag:       { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "Knowledge Base"  },
  fallback:  { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: "Fallback"        },
  ai:        { bg: "rgba(59,130,246,0.15)", color: "#3b82f6", label: "AI"              },
};

export default function AgentBadge({ agent }) {
  const cfg = BADGE[agent] || { bg: "rgba(100,116,139,0.15)", color: "#64748b", label: agent };
  return (
    <span style={{
      fontSize: "0.7rem",
      fontWeight: 600,
      padding: "0.2rem 0.55rem",
      borderRadius: "999px",
      background: cfg.bg,
      color: cfg.color,
      letterSpacing: "0.02em",
    }}>
      {cfg.label}
    </span>
  );
}
