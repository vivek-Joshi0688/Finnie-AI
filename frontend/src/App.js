import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Toolbar } from "@mui/material";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./Sidebar";
import Chat from "./Pages/Chat";




function App() {

  return (
    <BrowserRouter>
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div style={{ flex: 1, padding: "20px" }}>
          <Routes>
            <Route path="/" element={<h1>Home</h1>} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/dashboard" element={<h1>Dashboard</h1>} />
            <Route path="/settings" element={<h1>Settings</h1>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
  // const [msg, setMsg] = useState("");
  // const [textValue, setTextValue] = useState('');
  // const [answer, setAnswer] = useState("");

  // useEffect(() => {
  //   axios.get("http://127.0.0.1:8000/")
  //     .then(res => {
  //       console.log("FULL RESPONSE:", res);
  //       console.log("DATA:", res.data);
  //       setMsg(res.data.message);  // 👈 assignment
  //     })
  //     .catch(err => console.error(err));

  // }, []);


  // return (

  //   <div style={{ textAlign: "center", marginTop: "50px", width: "50%", border: "1px solid #8f7c7c", left: "25%", position: "absolute" }} >
  //     <h1 style={{ color: "blue" }}>{msg || "FINNI AI"} </h1>
  //     <div style={{ margin: "100px" }}>
  //       <p style={{ margin: "50px" }}>Response</p>
  //       <div style={{ border: 1, borderStyle: "solid #ccc", height: 100, width: "90%", margin: "auto", padding: 10, marginBottom: 20, overflowY: "scroll" }}>
  //        <p> {answer}</p>
  //       </div>
  //       <textarea style={{ width: "90%" }}
  //         value={textValue} onChange={(e) => setTextValue(e.target.value)}
  //         name="postContent" rows={4} cols={40} placeholder="Enter your message..."></textarea>
  //       <br />
  //       <button onClick={() => {
  //         axios.post("http://127.0.0.1:8000/ask", { prompt: textValue })
  //           .then(res => {
  //             setAnswer( res.data.response );
  //             console.log("RESPONSE:", '<p>' + res.data.response + '</p>');
  //           })
  //           .catch(err => console.error(err));
  //       }}>
  //         Send
  //       </button>
  //     </div>


  //   </div>
  // );
}

export default App;