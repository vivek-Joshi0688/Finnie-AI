// Chat.js
import { useState } from "react";
import axios from "axios";

export default function Chat() {
  const [msg, setMsg] = useState("");
  const [response, setResponse] = useState("");

  const sendMessage = async () => {
    const res = await axios.post("http://localhost:8000/chat", null, {
      params: { query: msg }
    });
    setResponse(JSON.stringify(res.data));
  };

  return (
    <div className="p-4">
      <input
        className="border p-2"
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
      <pre>{response}</pre>
    </div>
  );
}