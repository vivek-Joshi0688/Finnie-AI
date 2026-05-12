import { useState, useEffect } from "react";

const KEY = "finnie-conversations";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function makeTitle(messages) {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New Chat";
  const t = first.text.trim();
  return t.length > 40 ? t.slice(0, 40) + "…" : t;
}

export function useChatHistory() {
  const [conversations, setConversations] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  const createConversation = () => {
    const id = `c_${Date.now()}`;
    setConversations((prev) => [
      { id, title: "New Chat", createdAt: Date.now(), updatedAt: Date.now(), messages: [] },
      ...prev,
    ]);
    return id;
  };

  // Functional updater so callers never see stale messages
  const addMessage = (id, msg) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const messages = [...c.messages, msg];
        return { ...c, messages, title: makeTitle(messages), updatedAt: Date.now() };
      })
    );
  };

  const deleteConversation = (id) =>
    setConversations((prev) => prev.filter((c) => c.id !== id));

  const clearAll = () => setConversations([]);

  return { conversations, createConversation, addMessage, deleteConversation, clearAll };
}
