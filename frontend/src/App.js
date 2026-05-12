import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import ChatPage from "./Pages/ChatPage";
import PortfolioPage from "./Pages/PortfolioPage";
import MarketPage from "./Pages/MarketPage";
import NewsPage from "./Pages/NewsPage";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--fg)", transition: "background 0.2s, color 0.2s" }}>
          <Navbar />
          <Routes>
            <Route path="/"          element={<ChatPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/market"    element={<MarketPage />} />
            <Route path="/news"      element={<NewsPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
