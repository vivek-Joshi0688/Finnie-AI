import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const card = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "0.875rem",
  padding: "1.25rem",
};

function StatCard({ label, value, sub, valueColor }) {
  return (
    <div style={card}>
      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--fg-muted)", fontWeight: 500 }}>{label}</p>
      <p style={{ margin: "0.4rem 0 0", fontSize: "1.4rem", fontWeight: 700, color: valueColor || "var(--fg)" }}>{value}</p>
      {sub && <p style={{ margin: "0.2rem 0 0", fontSize: "0.72rem", color: valueColor || "var(--fg-muted)" }}>{sub}</p>}
    </div>
  );
}

function RefreshIcon({ spinning }) {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      style={{ animation: spinning ? "spin 1s linear infinite" : "none" }}
    >
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  );
}

function fmt(n) {
  return "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PnlCell({ pnl, pct }) {
  const color = pnl >= 0 ? "#10b981" : "#ef4444";
  const sign  = pnl >= 0 ? "+" : "";
  return (
    <td style={{ padding: "0.85rem 1.1rem", textAlign: "right", whiteSpace: "nowrap" }}>
      <span style={{ fontWeight: 600, color }}>{sign}{fmt(pnl)}</span>
      <br />
      <span style={{ fontSize: "0.72rem", color }}>{sign}{pct}%</span>
    </td>
  );
}

export default function PortfolioPage() {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [spinning,  setSpinning]  = useState(false);
  const [fetchedAt, setFetchedAt] = useState(null);

  const fetchPortfolio = useCallback(async () => {
    setSpinning(true);
    setError(null);
    try {
      const res = await axios.get("http://localhost:8001/portfolio/");
      setData(res.data);
      setFetchedAt(new Date().toLocaleTimeString("en-IN"));
    } catch {
      setError("Failed to load portfolio. Is the backend running?");
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  }, []);

  useEffect(() => { fetchPortfolio(); }, [fetchPortfolio]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--fg-muted)", gap: "0.5rem" }}>
      <RefreshIcon spinning />
      <span style={{ fontSize: "0.9rem" }}>Fetching live prices…</span>
    </div>
  );

  if (error) return (
    <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444", fontSize: "0.9rem" }}>{error}</div>
  );

  const { holdings = [], total_value, total_invested, total_pnl, total_pnl_pct } = data;
  const pnlColor = total_pnl >= 0 ? "#10b981" : "#ef4444";
  const pnlSign  = total_pnl >= 0 ? "+" : "";

  return (
    <div style={{ padding: "1.5rem 1rem", maxWidth: 960, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "var(--fg)" }}>Portfolio</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {fetchedAt && (
            <span style={{ fontSize: "0.72rem", color: "var(--fg-muted)" }}>Updated {fetchedAt}</span>
          )}
          <button
            onClick={fetchPortfolio}
            disabled={spinning}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.45rem 0.85rem", borderRadius: "0.5rem",
              border: "1px solid var(--border)", background: "var(--bg-card)",
              color: "var(--fg)", cursor: spinning ? "not-allowed" : "pointer",
              fontSize: "0.8rem", fontWeight: 500, opacity: spinning ? 0.6 : 1,
            }}
          >
            <RefreshIcon spinning={spinning} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard label="Total Value"    value={fmt(total_value)} />
        <StatCard label="Total Invested" value={fmt(total_invested)} />
        <StatCard
          label="Overall P&L"
          value={`${pnlSign}${fmt(total_pnl)}`}
          sub={`${pnlSign}${total_pnl_pct}%`}
          valueColor={pnlColor}
        />
        <StatCard label="Holdings" value={holdings.length} />
      </div>

      {/* Holdings table */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "0.9rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--fg)" }}>Holdings</h3>
          <span style={{ fontSize: "0.72rem", color: "var(--fg-muted)" }}>Live prices · NSE</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
            <thead>
              <tr style={{ background: "var(--bg-hover)" }}>
                {["Stock", "Qty", "Avg Buy", "Current", "Value", "P&L", "As of"].map((h, i) => (
                  <th key={h} style={{
                    padding: "0.65rem 1.1rem",
                    textAlign: i === 0 ? "left" : "right",
                    fontWeight: 600, color: "var(--fg-muted)",
                    fontSize: "0.75rem", whiteSpace: "nowrap",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr
                  key={h.symbol}
                  style={{ borderTop: "1px solid var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Stock name + ticker */}
                  <td style={{ padding: "0.85rem 1.1rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--fg)" }}>{h.name}</span>
                    <br />
                    <span style={{ fontSize: "0.7rem", color: "var(--fg-muted)" }}>{h.symbol}</span>
                  </td>

                  {/* Qty */}
                  <td style={{ padding: "0.85rem 1.1rem", textAlign: "right", color: "var(--fg-muted)" }}>
                    {h.qty}
                  </td>

                  {/* Avg buy price */}
                  <td style={{ padding: "0.85rem 1.1rem", textAlign: "right", color: "var(--fg-muted)" }}>
                    {fmt(h.buy_price)}
                  </td>

                  {/* Current price (orange warning if live fetch failed) */}
                  <td style={{ padding: "0.85rem 1.1rem", textAlign: "right", fontWeight: 600, color: "var(--fg)" }}>
                    {fmt(h.current_price)}
                    {!h.live && (
                      <span title="Live price unavailable — showing buy price" style={{ fontSize: "0.65rem", color: "#f59e0b", marginLeft: 4 }}>⚠</span>
                    )}
                  </td>

                  {/* Current total value */}
                  <td style={{ padding: "0.85rem 1.1rem", textAlign: "right", color: "var(--fg)" }}>
                    {fmt(h.current_value)}
                  </td>

                  {/* P&L */}
                  <PnlCell pnl={h.pnl} pct={h.pnl_pct} />

                  {/* Price date */}
                  <td style={{ padding: "0.85rem 1.1rem", textAlign: "right", fontSize: "0.72rem", color: "var(--fg-muted)", whiteSpace: "nowrap" }}>
                    {h.price_date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
