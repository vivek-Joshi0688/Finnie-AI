import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const QUICK_FILTERS = [
  { label: "All Markets",  query: "" },
  { label: "NIFTY 50",     query: "nifty 50" },
  { label: "TCS",          query: "tcs" },
  { label: "Reliance",     query: "reliance" },
  { label: "Infosys",      query: "infosys" },
  { label: "Crypto",       query: "bitcoin crypto" },
  { label: "Global",       query: "global stock market" },
];

function RefreshIcon({ spinning }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      style={{ animation: spinning ? "spin 1s linear infinite" : "none" }}>
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  );
}

function NewsCard({ article }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block",
        textDecoration: "none",
        background: "var(--bg-card)",
        border: `1px solid ${hovered ? "var(--accent)" : "var(--border)"}`,
        borderRadius: "0.875rem",
        padding: "1rem 1.15rem",
        transition: "border-color 0.15s, transform 0.15s, box-shadow 0.15s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.12)" : "none",
        cursor: "pointer",
      }}
    >
      {/* Source badge + time */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.3rem" }}>
        <span style={{
          fontSize: "0.68rem", fontWeight: 600, color: "var(--accent)",
          background: "rgba(96,165,250,0.12)", padding: "0.15rem 0.5rem",
          borderRadius: "999px", maxWidth: 180, overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {article.source}
        </span>
        <span style={{ fontSize: "0.68rem", color: "var(--fg-muted)" }}>
          {article.time_ago}
        </span>
      </div>

      {/* Headline */}
      <p style={{
        margin: 0, fontSize: "0.88rem", fontWeight: 600,
        color: "var(--fg)", lineHeight: 1.45,
        display: "-webkit-box", WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {article.title}
      </p>

      {/* Read link */}
      <div style={{ marginTop: "0.65rem", display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--accent)", fontSize: "0.75rem", fontWeight: 500 }}>
        Read full article <ExternalLinkIcon />
      </div>
    </a>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "0.875rem", padding: "1rem 1.15rem" }}>
      {["60%", "100%", "85%", "40%"].map((w, i) => (
        <div key={i} className="news-skeleton" style={{ height: i === 0 ? 12 : 14, width: w, borderRadius: 6, marginBottom: 10 }} />
      ))}
    </div>
  );
}

export default function NewsPage() {
  const [articles,  setArticles]  = useState([]);
  const [label,     setLabel]     = useState("Finance News");
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [spinning,  setSpinning]  = useState(false);
  const [search,    setSearch]    = useState("");
  const [active,    setActive]    = useState(0);
  const [fetchedAt, setFetchedAt] = useState(null);

  const fetchNews = useCallback(async (query = "") => {
    setSpinning(true);
    setError(null);
    try {
      const res = await axios.get("http://localhost:8001/news/", { params: { query } });
      setArticles(res.data.articles || []);
      setLabel(res.data.label || "Finance News");
      setFetchedAt(new Date().toLocaleTimeString("en-IN"));
    } catch {
      setError("Failed to load news. Is the backend running?");
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  }, []);

  useEffect(() => { fetchNews(""); }, [fetchNews]);

  const handleFilter = (idx, query) => {
    setActive(idx);
    setSearch("");
    fetchNews(query);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) fetchNews(search.trim());
  };

  return (
    <div style={{ padding: "1.5rem 1rem", maxWidth: 960, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "var(--fg)" }}>Finance News</h2>
          {fetchedAt && <p style={{ margin: "0.15rem 0 0", fontSize: "0.72rem", color: "var(--fg-muted)" }}>Updated {fetchedAt}</p>}
        </div>
        <button
          onClick={() => fetchNews(QUICK_FILTERS[active].query)}
          disabled={spinning}
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.45rem 0.85rem", borderRadius: "0.5rem",
            border: "1px solid var(--border)", background: "var(--bg-card)",
            color: "var(--fg)", cursor: spinning ? "not-allowed" : "pointer",
            fontSize: "0.8rem", fontWeight: 500, opacity: spinning ? 0.6 : 1,
          }}
        >
          <RefreshIcon spinning={spinning} /> Refresh
        </button>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          className="t-input"
          type="text"
          placeholder="Search news… e.g. TCS, HDFC, inflation"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "0.55rem 0.85rem", fontSize: "0.85rem" }}
        />
        <button
          type="submit"
          style={{
            padding: "0.55rem 1.1rem", borderRadius: "0.6rem", border: "none",
            background: "var(--accent)", color: "#fff", fontWeight: 600,
            fontSize: "0.85rem", cursor: "pointer",
          }}
        >
          Search
        </button>
      </form>

      {/* Quick filters */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        {QUICK_FILTERS.map((f, i) => (
          <button
            key={i}
            onClick={() => handleFilter(i, f.query)}
            style={{
              padding: "0.3rem 0.75rem", borderRadius: "999px", border: "1px solid var(--border)",
              background: active === i ? "var(--accent)" : "var(--bg-card)",
              color: active === i ? "#fff" : "var(--fg-muted)",
              fontSize: "0.78rem", fontWeight: 500, cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Result label */}
      {!loading && !error && (
        <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "var(--fg-muted)", fontWeight: 500 }}>
          {label} · {articles.length} article{articles.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: "1.5rem", textAlign: "center", color: "#ef4444", fontSize: "0.9rem", background: "var(--bg-card)", borderRadius: "0.875rem", border: "1px solid var(--border)" }}>
          {error}
        </div>
      )}

      {/* News grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : articles.length === 0
          ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "var(--fg-muted)", fontSize: "0.9rem" }}>
              No news found. Try a different search or filter.
            </div>
          )
          : articles.map((a, i) => <NewsCard key={i} article={a} />)
        }
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .news-skeleton {
          background: linear-gradient(90deg, var(--border) 25%, var(--bg-hover) 50%, var(--border) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  );
}
