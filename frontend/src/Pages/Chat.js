import React, { useState, useEffect } from "react";
import axios from "axios";


function Chat() {
    const [msg, setMsg] = useState("");
    const [textValue, setTextValue] = useState('');
    const [answer, setAnswer] = useState("");

    useEffect(() => {
        axios.get("http://127.0.0.1:8000/")
            .then(res => {
                console.log("FULL RESPONSE:", res);
                console.log("DATA:", res.data);
                setMsg(res.data.message);  // 👈 assignment
            })
            .catch(err => console.error(err));

    }, []);

   return (
    
    <div style={{ textAlign: "center"  }} >
      <div style={{ margin: "100px" }}>
        <div style={{ border: 1, borderStyle: "solid #ccc", width: "90%", margin: "auto", padding: 10, marginBottom: 20, overflowY: "scroll" }}>
         <p> {answer}</p>
        </div>
        <textarea style={{ width: "100%" }}
          value={textValue} onChange={(e) => setTextValue(e.target.value)}
          name="postContent" rows={4} cols={40} placeholder="Enter your message..."></textarea>
        <br />
        <button onClick={() => {
          axios.post("http://127.0.0.1:8000/ask", { prompt: textValue })
            .then(res => {
              setAnswer( res.data.response );
              console.log("RESPONSE:", '<p>' + res.data.response + '</p>');
            })
            .catch(err => console.error(err));
        }}>
          Send
        </button>
      </div>


    </div>
  );
}

export default Chat;
