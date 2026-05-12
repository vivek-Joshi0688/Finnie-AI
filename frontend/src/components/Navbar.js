import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

// ── Icons (must be defined BEFORE LINKS to satisfy ESLint no-undef) ───────────

function ChatIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function PortfolioIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
}

function MarketIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  );
}

function NewsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
      <path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1"  x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1"  y1="12" x2="3"  y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function MenuIcon({ open }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

// ── Nav links (after icons) ────────────────────────────────────────────────────

const LINKS = [
  { to: "/",          label: "Chat",      Icon: ChatIcon      },
  { to: "/portfolio", label: "Portfolio", Icon: PortfolioIcon },
  { to: "/market",    label: "Market",    Icon: MarketIcon    },
  { to: "/news",      label: "News",      Icon: NewsIcon      },
];

const iconBtn = {
  background: "transparent",
  border: "none",
  color: "rgba(241,245,249,0.75)",
  cursor: "pointer",
  padding: "0.4rem",
  borderRadius: "0.5rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.15s, color 0.15s",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Navbar() {
  const { dark, toggle } = useTheme();
  const [open, setOpen]  = useState(false);
  const location         = useLocation();

  const isActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <nav style={{ background: "var(--nav-bg)", borderBottom: "1px solid var(--nav-border)" }} className="sticky top-0 z-50">
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>

          {/* Brand */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ color: "#60a5fa", fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.02em" }}>Finnie</span>
            <span style={{ color: "var(--nav-fg)", fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.02em" }}>AI</span>
          </Link>

          {/* Desktop tabs */}
          <div className="finnie-desktop-nav" style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
            {LINKS.map(({ to, label, Icon }) => (
              <Link key={to} to={to} className={`nav-link${isActive(to) ? " active" : ""}`}>
                <Icon />
                {label}
              </Link>
            ))}
          </div>

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <button
              onClick={toggle}
              style={iconBtn}
              title={dark ? "Light mode" : "Dark mode"}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--nav-hover)"; e.currentTarget.style.color = "var(--nav-fg)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(241,245,249,0.75)"; }}
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>

            <button
              className="finnie-hamburger"
              onClick={() => setOpen((o) => !o)}
              style={iconBtn}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--nav-hover)"; e.currentTarget.style.color = "var(--nav-fg)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(241,245,249,0.75)"; }}
            >
              <MenuIcon open={open} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div
          className="finnie-mobile-menu"
          style={{ background: "var(--nav-bg)", borderTop: "1px solid var(--nav-border)", padding: "0.5rem 1rem 0.75rem" }}
        >
          {LINKS.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`nav-link${isActive(to) ? " active" : ""}`}
              style={{ display: "flex", marginBottom: "0.2rem" }}
            >
              <Icon />
              {label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (min-width: 640px) {
          .finnie-hamburger   { display: none !important; }
          .finnie-mobile-menu { display: none !important; }
        }
        @media (max-width: 639px) {
          .finnie-desktop-nav { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
