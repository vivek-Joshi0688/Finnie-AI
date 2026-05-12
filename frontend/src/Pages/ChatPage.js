import { useState, useEffect } from "react";
import ChatBox from "../components/ChatBox";
import ChatSidebar from "../components/ChatSidebar";
import { useChatHistory } from "../hooks/useChatHistory";

export default function ChatPage() {
  const { conversations, createConversation, addMessage, deleteConversation, clearAll } = useChatHistory();
  const [activeId, setActiveId]     = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // On mount: restore last active conversation or create one
  useEffect(() => {
    if (conversations.length > 0) {
      setActiveId((id) => id ?? conversations[0].id);
    } else {
      const id = createConversation();
      setActiveId(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the active conversation gets deleted, switch to the next available one
  useEffect(() => {
    if (activeId && !conversations.find((c) => c.id === activeId)) {
      setActiveId(conversations[0]?.id ?? null);
    }
  }, [conversations, activeId]);

  const handleNew = () => {
    const id = createConversation();
    setActiveId(id);
    // Close sidebar on mobile after creating a new chat
    if (window.innerWidth < 640) setSidebarOpen(false);
  };

  const handleDelete = (id) => {
    deleteConversation(id);
    // If deleting active conversation, pick another
    if (id === activeId) {
      const next = conversations.find((c) => c.id !== id);
      if (next) setActiveId(next.id);
      else {
        const newId = createConversation();
        setActiveId(newId);
      }
    }
  };

  const handleClearAll = () => {
    clearAll();
    const id = createConversation();
    setActiveId(id);
  };

  const activeMessages = conversations.find((c) => c.id === activeId)?.messages ?? [];

  const handleAddMessage = (msg) => {
    if (activeId) addMessage(activeId, msg);
  };

  return (
    <div style={{ height: "calc(100vh - 60px)", display: "flex", overflow: "hidden", background: "var(--bg)" }}>
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={handleNew}
        onDelete={handleDelete}
        onClearAll={handleClearAll}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <ChatBox
          key={activeId}
          messages={activeMessages}
          onAddMessage={handleAddMessage}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
        />
      </div>
    </div>
  );
}
