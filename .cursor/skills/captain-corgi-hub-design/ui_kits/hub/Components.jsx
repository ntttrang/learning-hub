// Captain Corgi Hub — Hub UI Kit · Components

const { useState } = React;

const StarMark = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
    <path d="M32 5.2 L39.6 22.4 L58.4 24.3 L44.3 37.2 L48.5 55.8 L32 46.1 L15.5 55.8 L19.7 37.2 L5.6 24.3 L24.4 22.4 Z"
          fill="#FBC00A" stroke="#D9A209" strokeWidth="2.4" strokeLinejoin="round"/>
  </svg>
);

/* ---------- HubNav ---------- */
const HubNav = ({ active = "Projects" }) => (
  <nav style={{
    position: "sticky", top: 0, zIndex: 10, background: "rgba(221,93,93,0.92)", backdropFilter: "blur(12px)",
    color: "var(--fg-on-brand)", padding: "14px 36px", display: "flex", alignItems: "center", gap: 32,
    borderBottom: "1.5px solid rgba(31,42,51,0.08)",
  }}>
    <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--fg-on-brand)" }}>
      <StarMark size={28}/>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em" }}>Captain Corgi Hub</span>
    </a>
    <div style={{ display: "flex", gap: 4, marginLeft: 24 }}>
      {["Projects", "Blog", "Crew", "Videos"].map((t) => (
        <a key={t} href="#" style={{
          padding: "8px 14px", borderRadius: "var(--r-md)", textDecoration: "none",
          fontFamily: "var(--font-body)", fontWeight: active === t ? 700 : 600, fontSize: 14,
          color: "var(--fg-on-brand)",
          background: active === t ? "rgba(31,42,51,0.22)" : "transparent",
        }}>{t}</a>
      ))}
    </div>
    <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
      <a href="#" style={{
        padding: "9px 16px", borderRadius: "var(--r-lg)", textDecoration: "none",
        fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13,
        color: "var(--fg-on-yellow)", background: "var(--star-yellow)", whiteSpace: "nowrap",
      }}>Join the crew</a>
    </div>
  </nav>
);

/* ---------- HubHero ---------- */
const HubHero = () => (
  <section style={{
    background: "var(--hub-coral)", color: "var(--fg-on-brand)",
    padding: "64px 36px 88px", position: "relative", overflow: "hidden",
  }}>
    <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 48, alignItems: "center" }}>
      <div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px",
          background: "rgba(31,42,51,0.22)", color: "var(--fg-on-brand)",
          fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 999, whiteSpace: "nowrap",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--star-yellow)" }}/> Open source · community
        </span>
        <h1 style={{
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 60,
          lineHeight: 1.02, letterSpacing: "-0.03em", margin: "16px 0 12px",
        }}>
          The crew behind <span style={{ color: "var(--star-yellow)" }}>Captain Corgi</span>.
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 18, lineHeight: 1.55, maxWidth: 520, opacity: 0.92 }}>
          We make small, sharp open-source tools, write honest notes about software, and ship clay-warm tutorials on YouTube. Sail with us.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <a href="#" style={{
            padding: "13px 22px", borderRadius: "var(--r-lg)", textDecoration: "none",
            fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15,
            color: "white", background: "var(--corgi-orange)", boxShadow: "var(--shadow-2)",
          }}>Browse projects →</a>
          <a href="#" style={{
            padding: "13px 22px", borderRadius: "var(--r-lg)", textDecoration: "none",
            fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15,
            color: "var(--fg-on-brand)", background: "rgba(31,42,51,0.22)", border: "1.5px solid rgba(246,242,234,0.4)", whiteSpace: "nowrap",
          }}>Watch on YouTube</a>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
        <img src="../../assets/captain-corgi-hub-avatar.png" alt="Hub crew"
             style={{ width: 340, height: 340, borderRadius: 999, border: "8px solid rgba(246,242,234,0.18)", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}/>
        <div style={{ position: "absolute", top: -12, right: 4 }}><StarMark size={56}/></div>
      </div>
    </div>
    {/* Soft radial gleam */}
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      background: "radial-gradient(circle at 80% 30%, rgba(251,192,10,0.18), transparent 50%)",
    }}/>
  </section>
);

/* ---------- ProjectCard ---------- */
const ProjectCard = ({ p }) => (
  <a href="#" style={{
    display: "flex", flexDirection: "column", gap: 12, padding: 22, textDecoration: "none",
    background: "var(--bg-elevated)", border: "1.5px solid var(--border-soft)", borderRadius: "var(--r-lg)",
    boxShadow: "var(--shadow-1)", color: "var(--fg)",
    transition: "transform var(--dur-fast) var(--ease-clay), box-shadow var(--dur-fast)",
  }} onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-2)"; }}
     onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-1)"; }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "var(--r-sm)", background: p.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16, color: "white" }}>{p.glyph}</span>
        </div>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, margin: 0, letterSpacing: "-0.01em" }}>{p.name}</h3>
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 4 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--star-yellow)" stroke="var(--star-yellow-deep)" strokeWidth="1.5"><path d="M12 2 L14.6 9 L22 9.5 L16.2 14.5 L18 22 L12 18 L6 22 L7.8 14.5 L2 9.5 L9.4 9 Z"/></svg>
        {p.stars}
      </span>
    </div>
    <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-2)", lineHeight: 1.5, margin: 0, minHeight: 42 }}>{p.desc}</p>
    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)" }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: p.langColor }}/>
        {p.lang}
      </span>
      <span style={{ marginLeft: "auto", fontFamily: "var(--font-body)", fontSize: 12, color: "var(--sky-cyan-deep)", fontWeight: 700, whiteSpace: "nowrap" }}>Watch the video →</span>
    </div>
  </a>
);

/* ---------- BlogCard ---------- */
const BlogCard = ({ post, large }) => (
  <a href="#" style={{
    display: "flex", flexDirection: large ? "row" : "column", gap: 20, textDecoration: "none", color: "var(--fg)",
    background: "var(--bg-elevated)", border: "1.5px solid var(--border-soft)", borderRadius: "var(--r-lg)",
    overflow: "hidden", boxShadow: "var(--shadow-1)",
    transition: "transform var(--dur-fast) var(--ease-clay), box-shadow var(--dur-fast)",
  }} onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-2)"; }}
     onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-1)"; }}>
    <div style={{
      flex: large ? "1.2" : "none", aspectRatio: large ? undefined : "16/9", minHeight: large ? 240 : undefined,
      background: post.bg, position: "relative",
    }}>
      <div style={{ position: "absolute", top: 14, left: 14 }}>
        <span style={{ background: "var(--star-yellow)", color: "var(--fg-on-yellow)", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 999, letterSpacing: "0.08em", textTransform: "uppercase" }}>{post.tag}</span>
      </div>
    </div>
    <div style={{ flex: 1, padding: 22, display: "flex", flexDirection: "column", gap: 10 }}>
      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: large ? 24 : 18, margin: 0, letterSpacing: "-0.01em", lineHeight: 1.2 }}>{post.title}</h3>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-2)", lineHeight: 1.55, margin: 0 }}>{post.excerpt}</p>
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-3)" }}>
        <img src="../../assets/captain-corgi-avatar.png" style={{ width: 22, height: 22, borderRadius: 999 }}/>
        <span style={{ fontWeight: 700, color: "var(--fg-2)" }}>{post.author}</span>
        <span>•</span>
        <span>{post.date}</span>
        <span>•</span>
        <span>{post.read}</span>
      </div>
    </div>
  </a>
);

/* ---------- MemberGrid ---------- */
const MemberGrid = ({ members }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
    {members.map((m) => (
      <div key={m.handle} style={{
        background: "var(--bg-elevated)", border: "1.5px solid var(--border-soft)", borderRadius: "var(--r-lg)",
        padding: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        boxShadow: "var(--shadow-1)",
      }}>
        <div style={{ width: 64, height: 64, borderRadius: 999, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "white" }}>{m.glyph}</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14 }}>{m.name}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>@{m.handle}</div>
        </div>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, color: "var(--fg-2)", background: "var(--bg-sunken)", padding: "3px 10px", borderRadius: 999 }}>{m.role}</span>
      </div>
    ))}
  </div>
);

const Section = ({ id, title, kicker, children }) => (
  <section id={id} style={{ padding: "64px 36px", maxWidth: 1180, margin: "0 auto", width: "100%" }}>
    {kicker && <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--captain-red)", letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 8 }}>{kicker}</div>}
    <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 38, letterSpacing: "-0.02em", margin: "0 0 28px" }}>{title}</h2>
    {children}
  </section>
);

const Footer = () => (
  <footer style={{ padding: "48px 36px", background: "#1F2A33", color: "#F6F2EA" }}>
    <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <StarMark size={28}/>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18 }}>Captain Corgi Hub</span>
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, opacity: 0.65 }}>© 2026 — set sail on better software.</div>
    </div>
  </footer>
);

Object.assign(window, { StarMark, HubNav, HubHero, ProjectCard, BlogCard, MemberGrid, Section, Footer });
