import { useState } from "react";

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function ConversationItem({ conv, isActive, onSelect, onDelete }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.55rem 0.65rem",
        borderRadius: "0.5rem",
        cursor: "pointer",
        background: isActive ? "var(--accent)" : hovered ? "var(--bg-hover)" : "transparent",
        color: isActive ? "#fff" : "var(--fg)",
        transition: "background 0.12s",
        userSelect: "none",
      }}
    >
      <span style={{ opacity: isActive ? 0.9 : 0.45, flexShrink: 0, color: isActive ? "#fff" : "var(--fg)" }}>
        <ChatBubbleIcon />
      </span>

      <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {conv.title}
        </p>
        <p style={{ margin: "0.1rem 0 0", fontSize: "0.68rem", opacity: isActive ? 0.75 : 0.5 }}>
          {conv.messages.length} msg{conv.messages.length !== 1 ? "s" : ""} · {timeAgo(conv.updatedAt)}
        </p>
      </div>

      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete conversation"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: isActive ? "rgba(255,255,255,0.8)" : "var(--fg-muted)",
            padding: "0.2rem",
            borderRadius: "0.3rem",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
}

export default function ChatSidebar({ conversations, activeId, onSelect, onNew, onDelete, onClearAll, open, onClose }) {
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClearAll = () => {
    if (confirmClear) { onClearAll(); setConfirmClear(false); }
    else { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="finnie-sb-backdrop"
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 30 }}
        />
      )}

      <aside className={`finnie-sb${open ? " open" : ""}`}>
        {/* Header */}
        <div style={{ padding: "0.75rem 0.75rem 0.5rem", borderBottom: "1px solid var(--border)" }}>
          <button
            onClick={onNew}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              padding: "0.55rem",
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: "0.6rem",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <PlusIcon />
            New Chat
          </button>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0.5rem" }}>
          {conversations.length === 0 ? (
            <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--fg-muted)", marginTop: "2rem", padding: "0 1rem" }}>
              No conversations yet. Start a new chat!
            </p>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeId}
                onSelect={() => { onSelect(conv.id); onClose?.(); }}
                onDelete={() => onDelete(conv.id)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {conversations.length > 0 && (
          <div style={{ padding: "0.5rem 0.75rem 0.75rem", borderTop: "1px solid var(--border)" }}>
            <button
              onClick={handleClearAll}
              style={{
                width: "100%",
                padding: "0.45rem",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                cursor: "pointer",
                color: confirmClear ? "#ef4444" : "var(--fg-muted)",
                fontSize: "0.75rem",
                fontWeight: 500,
                transition: "color 0.15s, border-color 0.15s",
                borderColor: confirmClear ? "#ef4444" : "var(--border)",
              }}
            >
              {confirmClear ? "Click again to confirm" : "Clear all history"}
            </button>
          </div>
        )}
      </aside>

      <style>{`
        .finnie-sb {
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          background: var(--bg-card);
          border-right: 1px solid var(--border);
          overflow: hidden;
          width: 0;
          transition: width 0.2s ease;
          z-index: 40;
        }
        .finnie-sb.open { width: 252px; }

        @media (max-width: 639px) {
          .finnie-sb {
            position: fixed;
            top: 60px;
            left: 0;
            bottom: 0;
            width: 280px;
            transform: translateX(-100%);
            transition: transform 0.22s ease;
          }
          .finnie-sb.open {
            transform: translateX(0);
          }
          .finnie-sb-backdrop { display: block; }
        }
        @media (min-width: 640px) {
          .finnie-sb-backdrop { display: none !important; }
        }
      `}</style>
    </>
  );
}
