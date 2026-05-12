import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useTheme } from "../context/ThemeContext";

const PERIODS = ["1W", "1M", "3M", "6M"];

const card = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "0.875rem",
};

// ── Small helpers ─────────────────────────────────────────────────────────────

function fmt(n) {
  return Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

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

function ArrowUp() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "0.6rem", padding: "0.6rem 0.9rem", fontSize: "0.8rem", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
      <p style={{ margin: "0 0 0.4rem", fontWeight: 600, color: "var(--fg)" }}>{label}</p>
      {payload.map((p) => {
        const isPos = p.value >= 0;
        return (
          <p key={p.dataKey} style={{ margin: "0.15rem 0", color: p.color }}>
            {p.dataKey}: <strong>{isPos ? "+" : ""}{p.value.toFixed(2)}%</strong>
          </p>
        );
      })}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ h = 14, w = "100%", mb = 8 }) {
  return <div className="mkt-skeleton" style={{ height: h, width: w, borderRadius: 6, marginBottom: mb }} />;
}

function IndexCardSkeleton() {
  return (
    <div style={{ ...card, padding: "1.1rem 1.25rem" }}>
      <Skeleton h={11} w="55%" mb={10} />
      <Skeleton h={26} w="70%" mb={8} />
      <Skeleton h={13} w="40%" mb={0} />
    </div>
  );
}

// ── Index card ────────────────────────────────────────────────────────────────

function IndexCard({ idx }) {
  const color = idx.up ? "#10b981" : "#ef4444";
  const sign  = idx.up ? "+" : "";
  return (
    <div style={{ ...card, padding: "1.1rem 1.25rem" }}>
      <p style={{ margin: 0, fontSize: "0.74rem", color: "var(--fg-muted)", fontWeight: 500 }}>{idx.name}</p>
      <p style={{ margin: "0.3rem 0 0.2rem", fontSize: "1.35rem", fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.02em" }}>
        {fmt(idx.value)}
      </p>
      <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color, display: "flex", alignItems: "center", gap: "0.2rem" }}>
        {idx.up ? <ArrowUp /> : <ArrowDown />}
        {sign}{fmt(idx.change)} ({sign}{idx.change_pct.toFixed(2)}%)
      </p>
    </div>
  );
}

// ── Mover row ─────────────────────────────────────────────────────────────────

function MoverRow({ m }) {
  const color = m.up ? "#10b981" : "#ef4444";
  const sign  = m.up ? "+" : "";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.55rem 0", borderBottom: "1px solid var(--border)" }}>
      <div>
        <p style={{ margin: 0, fontSize: "0.84rem", fontWeight: 600, color: "var(--fg)" }}>{m.name}</p>
        <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--fg-muted)" }}>{m.symbol}</p>
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "var(--fg)" }}>₹{fmt(m.price)}</p>
        <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color }}>{sign}{m.change_pct.toFixed(2)}%</p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MarketPage() {
  const { dark }                    = useTheme();
  const [data,      setData]        = useState(null);
  const [loading,   setLoading]     = useState(true);
  const [spinning,  setSpinning]    = useState(false);
  const [error,     setError]       = useState(null);
  const [period,    setPeriod]      = useState("1M");
  const [fetchedAt, setFetchedAt]   = useState(null);

  const axisClr = dark ? "#94a3b8" : "#6b7280";
  const gridClr = dark ? "#334155" : "#e5e7eb";

  const fetchTrends = useCallback(async (p) => {
    setSpinning(true);
    setError(null);
    try {
      const res = await axios.get("http://localhost:8001/market/trends", { params: { period: p } });
      setData(res.data);
      setFetchedAt(new Date().toLocaleTimeString("en-IN"));
    } catch {
      setError("Failed to load market data. Is the backend running?");
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  }, []);

  useEffect(() => { fetchTrends("1M"); }, [fetchTrends]);

  const handlePeriod = (p) => { setPeriod(p); fetchTrends(p); };

  return (
    <div style={{ padding: "1.5rem 1rem", maxWidth: 1000, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "var(--fg)" }}>Market Trends</h2>
          {fetchedAt && <p style={{ margin: "0.15rem 0 0", fontSize: "0.72rem", color: "var(--fg-muted)" }}>Live data · Updated {fetchedAt}</p>}
        </div>
        <button onClick={() => fetchTrends(period)} disabled={spinning} style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          padding: "0.45rem 0.85rem", borderRadius: "0.5rem",
          border: "1px solid var(--border)", background: "var(--bg-card)",
          color: "var(--fg)", cursor: spinning ? "not-allowed" : "pointer",
          fontSize: "0.8rem", fontWeight: 500, opacity: spinning ? 0.6 : 1,
        }}>
          <RefreshIcon spinning={spinning} /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && <div style={{ padding: "1rem", borderRadius: "0.75rem", background: "var(--bg-card)", border: "1px solid var(--border)", color: "#ef4444", marginBottom: "1.25rem", fontSize: "0.88rem" }}>{error}</div>}

      {/* Index cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {loading
          ? [1, 2, 3].map((i) => <IndexCardSkeleton key={i} />)
          : (data?.indices || []).map((idx) => <IndexCard key={idx.name} idx={idx} />)
        }
      </div>

      {/* Chart + Movers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1rem", alignItems: "start" }}>

        {/* Chart */}
        <div style={{ ...card, padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--fg)" }}>
              Performance (% change)
            </h3>
            {/* Period selector */}
            <div style={{ display: "flex", gap: "0.3rem" }}>
              {PERIODS.map((p) => (
                <button key={p} onClick={() => handlePeriod(p)} style={{
                  padding: "0.25rem 0.6rem", borderRadius: "0.4rem",
                  border: "1px solid var(--border)",
                  background: period === p ? "var(--accent)" : "transparent",
                  color: period === p ? "#fff" : "var(--fg-muted)",
                  fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Skeleton h={280} w="100%" mb={0} />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data?.chart || []} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridClr} vertical={false} />
                <ReferenceLine y={0} stroke={axisClr} strokeDasharray="4 2" strokeWidth={1} />
                <XAxis dataKey="date" tick={{ fill: axisClr, fontSize: 11 }} axisLine={false} tickLine={false}
                  interval="preserveStartEnd" />
                <YAxis tick={{ fill: axisClr, fontSize: 11 }} axisLine={false} tickLine={false} width={48}
                  tickFormatter={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="NIFTY_pct"  name="NIFTY 50" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="SENSEX_pct" name="SENSEX"   stroke="#8b5cf6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Legend */}
          <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", marginTop: "0.75rem" }}>
            {[{ color: "#3b82f6", label: "NIFTY 50" }, { color: "#8b5cf6", label: "SENSEX" }].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ display: "inline-block", width: 20, height: 3, background: l.color, borderRadius: 2 }} />
                <span style={{ fontSize: "0.78rem", color: "var(--fg-muted)" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gainers / Losers */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Gainers */}
          <div style={{ ...card, padding: "1rem 1.15rem" }}>
            <h3 style={{ margin: "0 0 0.6rem", fontSize: "0.88rem", fontWeight: 600, color: "#10b981", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <ArrowUp /> Top Gainers
            </h3>
            {loading
              ? [1,2,3].map((i) => <Skeleton key={i} h={36} mb={6} />)
              : (data?.gainers || []).map((m) => <MoverRow key={m.symbol} m={m} />)
            }
          </div>

          {/* Losers */}
          <div style={{ ...card, padding: "1rem 1.15rem" }}>
            <h3 style={{ margin: "0 0 0.6rem", fontSize: "0.88rem", fontWeight: 600, color: "#ef4444", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <ArrowDown /> Top Losers
            </h3>
            {loading
              ? [1,2,3].map((i) => <Skeleton key={i} h={36} mb={6} />)
              : (data?.losers || []).map((m) => <MoverRow key={m.symbol} m={m} />)
            }
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .mkt-skeleton {
          background: linear-gradient(90deg, var(--border) 25%, var(--bg-hover) 50%, var(--border) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @media (max-width: 720px) {
          .mkt-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
