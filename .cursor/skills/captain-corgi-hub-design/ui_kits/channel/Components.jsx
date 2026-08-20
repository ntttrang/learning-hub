// Captain Corgi Hub — Channel UI Kit · Components
// Exposed on window so App.jsx can import.

const { useState } = React;

/* ---------- Icons (Lucide-style inline) ---------- */
const Icon = ({ d, size = 20, fill = "none", stroke = "currentColor", sw = 1.75, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {children || (d ? <path d={d} /> : null)}
  </svg>
);

const StarMark = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
    <path d="M32 5.2 L39.6 22.4 L58.4 24.3 L44.3 37.2 L48.5 55.8 L32 46.1 L15.5 55.8 L19.7 37.2 L5.6 24.3 L24.4 22.4 Z"
          fill="#FBC00A" stroke="#D9A209" strokeWidth="2.4" strokeLinejoin="round"/>
  </svg>
);

const IconHome    = (p) => <Icon {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Icon>;
const IconFlame   = (p) => <Icon {...p}><path d="M8.5 14.5a4 4 0 1 0 6.8-2.7c-.7-.7-1.3-1.5-1.3-2.4 0-1.5 1-2.7 1-4.4 0-2-1.5-3-3-3 0 3-3 4-3 7 0 1.7-1.5 2.5-1.5 4.5z"/></Icon>;
const IconList    = (p) => <Icon {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></Icon>;
const IconClock   = (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Icon>;
const IconHistory = (p) => <Icon {...p}><polyline points="3 12 3 6 9 6"/><path d="M3.5 9.5A9 9 0 1 1 6 19.7"/><polyline points="12 7 12 12 16 14"/></Icon>;
const IconSearch  = (p) => <Icon {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Icon>;
const IconPlay    = (p) => <Icon {...p} fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></Icon>;
const IconLike    = (p) => <Icon {...p}><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9A2 2 0 0 0 19.66 9z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></Icon>;
const IconShare   = (p) => <Icon {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></Icon>;
const IconSave    = (p) => <Icon {...p}><polyline points="19 21 12 16 5 21 5 5 19 5 19 21"/></Icon>;
const IconArrowLeft = (p) => <Icon {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></Icon>;
const IconBell    = (p) => <Icon {...p}><path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Icon>;
const IconUpload  = (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Icon>;
const IconUser    = (p) => <Icon {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Icon>;

/* ---------- TopBar ---------- */
const TopBar = ({ onSearch }) => (
  <header style={{
    position: "sticky", top: 0, zIndex: 10,
    background: "color-mix(in srgb, var(--bg) 88%, transparent)", backdropFilter: "blur(12px)",
    borderBottom: "1.5px solid var(--border-soft)",
    padding: "10px 24px", display: "flex", alignItems: "center", gap: 18,
  }}>
    <a href="#" style={{ display: "flex", alignItems: "baseline", gap: 10, textDecoration: "none" }}>
      <StarMark size={32}/>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--fg)", letterSpacing: "-0.02em" }}>Captain Corgi</span>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 11, color: "var(--captain-red)", letterSpacing: "0.18em" }}>/ HUB</span>
    </a>
    <div style={{ flex: 1, maxWidth: 520, marginLeft: 32, display: "flex", alignItems: "center", gap: 0 }}>
      <div style={{ flex: 1, position: "relative" }}>
        <IconSearch size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--fg-3)" }}/>
        <input placeholder="Search videos, playlists, topics…"
               onChange={(e) => onSearch?.(e.target.value)}
               style={{
                 width: "100%", padding: "10px 14px 10px 38px", fontSize: 14,
                 fontFamily: "var(--font-body)", color: "var(--fg)",
                 border: "1.5px solid var(--border-strong)",
                 borderRadius: "var(--r-full)", background: "var(--bg-elevated)", outline: "none",
               }}/>
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginLeft: "auto" }}>
      <IconButton><IconUpload/></IconButton>
      <IconButton aria-label="Notifications">
        <IconBell/>
        <span style={{ position: "absolute", top: 5, right: 6, width: 8, height: 8, borderRadius: 999, background: "var(--captain-red)" }}/>
      </IconButton>
      <img src="../../assets/captain-corgi-avatar.png" alt="me"
           style={{ width: 36, height: 36, borderRadius: 999, objectFit: "cover", border: "1.5px solid var(--border)" }}/>
    </div>
  </header>
);

const IconButton = ({ children, ...rest }) => (
  <button {...rest} style={{
    width: 38, height: 38, borderRadius: 999, border: "none", background: "transparent",
    cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
    color: "var(--fg-2)", position: "relative",
    transition: "background var(--dur-fast) var(--ease-out)",
  }} onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-sunken)"}
     onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
    {children}
  </button>
);

/* ---------- Sidebar ---------- */
const Sidebar = ({ active, onNav }) => {
  const items = [
    { id: "home",     label: "Home",          icon: <IconHome/> },
    { id: "trending", label: "Trending",      icon: <IconFlame/> },
    { id: "subs",     label: "Subscriptions", icon: <IconList/> },
    { id: "later",    label: "Watch later",   icon: <IconClock/> },
    { id: "history",  label: "History",       icon: <IconHistory/> },
  ];
  return (
    <nav style={{
      width: 220, flexShrink: 0, padding: "20px 12px", borderRight: "1.5px solid var(--border-soft)",
      position: "sticky", top: 64, alignSelf: "flex-start", height: "calc(100vh - 64px)",
    }}>
      {items.map((it) => (
        <button key={it.id} onClick={() => onNav?.(it.id)} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 14,
          padding: "10px 14px", marginBottom: 4, borderRadius: "var(--r-md)",
          border: "none", cursor: "pointer", textAlign: "left",
          fontFamily: "var(--font-body)", fontSize: 14, fontWeight: active === it.id ? 700 : 500,
          color: active === it.id ? "var(--fg)" : "var(--fg-2)",
          background: active === it.id ? "color-mix(in srgb, var(--accent) 16%, var(--bg-elevated))" : "transparent",
          boxShadow: active === it.id ? "inset 3px 0 0 var(--accent)" : "none",
          transition: "background var(--dur-fast)",
        }} onMouseOver={(e) => active !== it.id && (e.currentTarget.style.background = "color-mix(in srgb, var(--fg) 5%, transparent)")}
           onMouseOut={(e) => active !== it.id && (e.currentTarget.style.background = "transparent")}>
          {it.icon}<span>{it.label}</span>
        </button>
      ))}
      <div style={{ height: 1, background: "var(--border-soft)", margin: "16px 8px" }}/>
      <div style={{ padding: "0 14px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 8 }}>Subscriptions</div>
      <SubRow name="Fireship" dot="#E13429"/>
      <SubRow name="Theo - t3.gg" dot="#3BB283"/>
      <SubRow name="Prime Time" dot="#51BBD7"/>
    </nav>
  );
};

const SubRow = ({ name, dot }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-2)" }}>
    <span style={{ width: 22, height: 22, borderRadius: 999, background: dot, flexShrink: 0 }}/>
    <span>{name}</span>
  </div>
);

/* ---------- ChannelHeader ---------- */
const ChannelHeader = ({ tab, onTab }) => {
  const [subscribed, setSubscribed] = useState(true);
  return (
    <section>
      {/* Banner */}
      <div style={{
        height: 180, borderRadius: "var(--r-xl)", margin: "20px 0 0",
        background: "linear-gradient(135deg, #3D768E 0%, #51BBD7 100%)",
        position: "relative", overflow: "hidden",
      }}>
        <StarMark size={120} aria-hidden="true"/>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="100%" height="100%" viewBox="0 0 800 180" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
            {[...Array(14)].map((_, i) => (
              <g key={i} transform={`translate(${50 + i*55} ${20 + (i%3)*45}) rotate(${i*23})`} opacity="0.18">
                <path d="M0 -8 L2.6 -2.4 L8.5 -1.7 L4.3 2.3 L5.4 8.5 L0 5.5 L-5.4 8.5 L-4.3 2.3 L-8.5 -1.7 L-2.6 -2.4 Z" fill="#FBC00A"/>
              </g>
            ))}
          </svg>
        </div>
      </div>
      {/* Identity row */}
      <div style={{ display: "flex", gap: 24, padding: "20px 0 8px", alignItems: "flex-end" }}>
        <img src="../../assets/captain-corgi-avatar.png"
             alt="Captain Corgi"
             style={{ width: 130, height: 130, borderRadius: 999, marginTop: -60, border: "5px solid var(--bg-elevated)", boxShadow: "var(--shadow-2)", objectFit: "cover" }}/>
        <div style={{ flex: 1, paddingBottom: 8 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 36, letterSpacing: "-0.02em", margin: "0 0 4px" }}>Captain Corgi</h1>
          <div style={{ display: "flex", gap: 14, fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-3)" }}>
            <span>@captain-corgi</span>
            <span>•</span>
            <span><b style={{ color: "var(--fg)" }}>128K</b> subscribers</span>
            <span>•</span>
            <span><b style={{ color: "var(--fg)" }}>84</b> videos</span>
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-2)", margin: "8px 0 0", maxWidth: 560, lineHeight: 1.55 }}>
            Software, AI, and the tools we ship with — explained by a clay corgi captain. New videos most Tuesdays.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, paddingBottom: 8 }}>
          <SubscribeButton subscribed={subscribed} onClick={() => setSubscribed(!subscribed)}/>
          <button style={{
            padding: "11px 18px", borderRadius: "var(--r-lg)", border: "1.5px solid var(--border-strong)",
            background: "var(--bg-elevated)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, color: "var(--fg)",
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            <IconBell size={16}/> Notify
          </button>
        </div>
      </div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1.5px solid var(--border-soft)", marginTop: 12 }}>
        {["Home", "Videos", "Playlists", "About"].map((t) => (
          <button key={t} onClick={() => onTab?.(t)} style={{
            padding: "12px 18px", border: "none", background: tab === t ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent", cursor: "pointer",
            fontFamily: "var(--font-body)", fontWeight: tab === t ? 700 : 500, fontSize: 14,
            color: tab === t ? "var(--fg)" : "var(--fg-3)",
            borderTopLeftRadius: "var(--r-md)", borderTopRightRadius: "var(--r-md)",
            borderBottom: tab === t ? "3px solid var(--corgi-orange)" : "3px solid transparent",
            marginBottom: -1.5,
          }}>{t}</button>
        ))}
      </div>
    </section>
  );
};

const SubscribeButton = ({ subscribed, onClick }) => (
  <button onClick={onClick} style={{
    padding: "11px 22px", borderRadius: "var(--r-lg)", border: "none", cursor: "pointer",
    background: subscribed ? "var(--bg-sunken)" : "var(--corgi-orange)",
    color: subscribed ? "var(--fg)" : "white",
    fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14,
    display: "inline-flex", alignItems: "center", gap: 8,
    boxShadow: subscribed ? "none" : "var(--shadow-1)",
    transition: "transform var(--dur-fast) var(--ease-clay)",
  }} onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.97)"}
     onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
     onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
    {subscribed ? "Subscribed" : (<><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2 L14.6 9 L22 9.5 L16.2 14.5 L18 22 L12 18 L6 22 L7.8 14.5 L2 9.5 L9.4 9 Z"/></svg> Subscribe</>)}
  </button>
);

/* ---------- VideoCard / VideoGrid ---------- */
const VideoCard = ({ video, onOpen, compact }) => (
  <article onClick={() => onOpen?.(video)} style={{
    cursor: "pointer", display: "flex", flexDirection: "column", gap: 10,
  }}>
    <div style={{
      position: "relative", aspectRatio: "16/9", borderRadius: "var(--r-lg)",
      overflow: "hidden", background: video.bg || "linear-gradient(135deg, #3D768E, #51BBD7)",
      boxShadow: "var(--shadow-1)", transition: "transform var(--dur-fast) var(--ease-clay), box-shadow var(--dur-fast)",
    }} onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-2)"; }}
       onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-1)"; }}>
      {/* Thumb illustration: big numeral + topic */}
      <div style={{ position: "absolute", inset: 0, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{
            background: "var(--star-yellow)", color: "var(--fg)",
            fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
            padding: "4px 10px", borderRadius: 999, letterSpacing: "0.04em",
          }}>{video.topic}</span>
          <StarMark size={28}/>
        </div>
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 800, color: "white",
          fontSize: compact ? 22 : 30, lineHeight: 1.05, letterSpacing: "-0.02em",
          textShadow: "0 2px 6px rgba(0,0,0,0.35)", maxWidth: "85%",
        }}>{video.thumb}</div>
      </div>
      <span style={{
        position: "absolute", bottom: 10, right: 10,
        background: "rgba(31,42,51,0.85)", color: "white",
        fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
        padding: "3px 8px", borderRadius: 4,
      }}>{video.duration}</span>
    </div>
    <div style={{ display: "flex", gap: 12 }}>
      <img src="../../assets/captain-corgi-avatar.png" alt=""
           style={{ width: 36, height: 36, borderRadius: 999, objectFit: "cover", flexShrink: 0 }}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, margin: 0, color: "var(--fg)", lineHeight: 1.3, letterSpacing: "-0.01em" }}>
          {video.title}
        </h3>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-3)", marginTop: 4 }}>
          Captain Corgi · {video.views} views · {video.age}
        </div>
      </div>
    </div>
  </article>
);

const VideoGrid = ({ heading, videos, onOpen, columns = 3 }) => (
  <section style={{ marginTop: 28 }}>
    {heading && <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, letterSpacing: "-0.01em", margin: "0 0 16px" }}>{heading}</h2>}
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 20 }}>
      {videos.map((v) => <VideoCard key={v.id} video={v} onOpen={onOpen}/>)}
    </div>
  </section>
);

/* ---------- VideoPlayer ---------- */
const VideoPlayer = ({ video, onBack, related }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, paddingTop: 16 }}>
    <main>
      <button onClick={onBack} style={{
        display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px",
        background: "transparent", border: "none", cursor: "pointer",
        fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-2)", fontWeight: 600,
        borderRadius: "var(--r-md)", marginBottom: 12,
      }} onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-sunken)"}
         onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
        <IconArrowLeft size={16}/> Back to channel
      </button>
      <div style={{
        aspectRatio: "16/9", borderRadius: "var(--r-xl)", overflow: "hidden",
        background: video.bg || "linear-gradient(135deg, #3D768E, #51BBD7)",
        position: "relative", boxShadow: "var(--shadow-3)",
      }}>
        <div style={{ position: "absolute", inset: 0, padding: 32, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ background: "var(--star-yellow)", color: "var(--fg)", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 999 }}>{video.topic}</span>
            <StarMark size={44}/>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "white", fontSize: 52, lineHeight: 1.05, letterSpacing: "-0.02em", textShadow: "0 3px 10px rgba(0,0,0,0.4)" }}>{video.thumb}</div>
        </div>
        {/* Big play button */}
        <button aria-label="play" style={{
          position: "absolute", inset: 0, margin: "auto", width: 92, height: 92,
          borderRadius: 999, border: "none", cursor: "pointer",
          background: "rgba(225,52,41,0.92)", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
        }}><IconPlay size={36}/></button>
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, letterSpacing: "-0.02em", margin: "20px 0 12px" }}>{video.title}</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="../../assets/captain-corgi-avatar.png" style={{ width: 44, height: 44, borderRadius: 999, objectFit: "cover" }}/>
          <div>
            <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, color: "var(--fg)" }}>Captain Corgi</div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-3)" }}>128K subscribers</div>
          </div>
          <SubscribeButton subscribed={false}/>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <ActionPill icon={<IconLike size={16}/>} label="12K"/>
          <ActionPill icon={<IconShare size={16}/>} label="Share"/>
          <ActionPill icon={<IconSave size={16}/>} label="Save"/>
        </div>
      </div>
      <div style={{
        marginTop: 16, padding: 18, borderRadius: "var(--r-lg)",
        background: "var(--bg-sunken)", fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.6, color: "var(--fg)",
      }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 8, fontSize: 13, color: "var(--fg-2)", fontWeight: 700 }}>
          <span>{video.views} views</span><span>•</span><span>{video.age}</span>
        </div>
        Today we're shipping a tiny RAG pipeline. We'll start with <code style={{ fontFamily: "var(--font-mono)", background: "var(--bg-elevated)", padding: "2px 6px", borderRadius: 6, color: "var(--captain-red-deep)" }}>embeddings</code>, then bolt on retrieval. The captain has done this before; we'll figure it out together.
      </div>
    </main>
    <aside>
      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, margin: "0 0 14px", color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Up next</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {related.map((v) => (
          <article key={v.id} style={{ display: "flex", gap: 12, cursor: "pointer" }}>
            <div style={{ width: 140, aspectRatio: "16/9", borderRadius: "var(--r-md)", overflow: "hidden", background: v.bg, flexShrink: 0, position: "relative" }}>
              <div style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(31,42,51,0.85)", color: "white", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4 }}>{v.duration}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--fg)", lineHeight: 1.3, marginBottom: 4 }}>{v.title}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--fg-3)" }}>Captain Corgi · {v.views} · {v.age}</div>
            </div>
          </article>
        ))}
      </div>
    </aside>
  </div>
);

const ActionPill = ({ icon, label }) => (
  <button style={{
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "10px 16px", borderRadius: "var(--r-full)",
    background: "var(--bg-sunken)", border: "none", cursor: "pointer",
    fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--fg)",
  }}>{icon}{label}</button>
);

Object.assign(window, {
  TopBar, Sidebar, ChannelHeader, VideoCard, VideoGrid, VideoPlayer,
  StarMark, IconHome, IconPlay,
});
