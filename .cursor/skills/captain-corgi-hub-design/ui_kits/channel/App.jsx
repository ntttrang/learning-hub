// Captain Corgi Hub — Channel UI Kit · App
// Demo: channel home → click a video → watch view → back.

const { useState } = React;

const VIDEOS = [
  { id: "v1", title: "Building a tiny RAG pipeline from scratch",   topic: "AI",         thumb: "RAG · 50 LOC", duration: "12:34", views: "42K", age: "2 days ago",  bg: "linear-gradient(135deg,#3D768E 0%,#51BBD7 100%)" },
  { id: "v2", title: "Why I switched to Go for AI tooling",          topic: "GO",         thumb: "Go for AI",    duration: "08:20", views: "18K", age: "1 wk ago",   bg: "linear-gradient(135deg,#DD5D5D 0%,#E13429 100%)" },
  { id: "v3", title: "Kubernetes for tiny side projects",            topic: "K8S",        thumb: "K8s, tiny",    duration: "21:05", views: "9K",  age: "3 wks ago",  bg: "linear-gradient(135deg,#289269 0%,#3BB283 100%)" },
  { id: "v4", title: "Postgres tricks every dev should know",        topic: "PG",         thumb: "Postgres ☆",   duration: "14:42", views: "31K", age: "1 mo ago",   bg: "linear-gradient(135deg,#2C5A6E 0%,#3D768E 100%)" },
  { id: "v5", title: "Local LLMs in 2026 — what actually works",     topic: "LLM",        thumb: "Local LLMs",   duration: "18:11", views: "67K", age: "2 mo ago",   bg: "linear-gradient(135deg,#B82A21 0%,#E13429 100%)" },
  { id: "v6", title: "I rewrote my homelab in 48 hours",             topic: "DEVOPS",     thumb: "Homelab v2",   duration: "26:09", views: "12K", age: "3 mo ago",   bg: "linear-gradient(135deg,#E27506 0%,#FC8903 100%)" },
];

const POPULAR = [
  { ...VIDEOS[4] },
  { ...VIDEOS[0] },
  { ...VIDEOS[3] },
];

function App() {
  const [route, setRoute] = useState({ name: "channel" });
  const [tab, setTab] = useState("Home");

  const open = (video) => setRoute({ name: "watch", video });
  const back = () => setRoute({ name: "channel" });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }} data-screen-label="Channel">
      <TopBar/>
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar active="home"/>
        <main style={{
          flex: 1, padding: "0 32px 64px", maxWidth: 1240, margin: "0 auto", width: "100%",
        }}>
          {route.name === "channel" && (
            <>
              <ChannelHeader tab={tab} onTab={setTab}/>
              {tab === "Home" && (
                <>
                  <VideoGrid heading="Most popular" videos={POPULAR} onOpen={open}/>
                  <VideoGrid heading="Latest" videos={VIDEOS.slice(0,3)} onOpen={open}/>
                  <VideoGrid heading="All videos" videos={VIDEOS} onOpen={open}/>
                </>
              )}
              {tab === "Videos" && <VideoGrid heading="All uploads — newest first" videos={VIDEOS} onOpen={open}/>}
              {tab === "Playlists" && <Placeholder text="Playlists land here. Ask the captain which ones to highlight."/>}
              {tab === "About" && <AboutPanel/>}
            </>
          )}
          {route.name === "watch" && (
            <VideoPlayer video={route.video} onBack={back} related={VIDEOS.filter((v) => v.id !== route.video.id).slice(0,4)}/>
          )}
        </main>
      </div>
    </div>
  );
}

const Placeholder = ({ text }) => (
  <div style={{
    margin: "32px 0", padding: 48, borderRadius: "var(--r-xl)",
    background: "var(--clay-cream-2)", border: "1.5px dashed var(--border-strong)",
    textAlign: "center", fontFamily: "var(--font-body)", color: "var(--ink-3)", fontSize: 15,
  }}>{text}</div>
);

const AboutPanel = () => (
  <div style={{ maxWidth: 720, padding: "32px 0", display: "flex", flexDirection: "column", gap: 20 }}>
    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, margin: 0, letterSpacing: "-0.01em" }}>About this channel</h3>
    <p style={{ fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.6, color: "var(--ink)", margin: 0 }}>
      We make software, AI, and devops feel hand-crafted again. The captain — a clay corgi — leads short, careful tutorials with real code and honest takes. New videos most Tuesdays.
    </p>
    <div style={{ display: "flex", gap: 24, paddingTop: 8, fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink-2)" }}>
      <div><div style={{ color: "var(--ink-3)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Joined</div>2023</div>
      <div><div style={{ color: "var(--ink-3)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Total views</div>3.2M</div>
      <div><div style={{ color: "var(--ink-3)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Country</div>Earth 🌎</div>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
