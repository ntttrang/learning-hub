// Captain Corgi Hub — Hub UI Kit · App
const PROJECTS = [
  { name: "rag-tiny",     glyph: "R", bg: "var(--captain-red)",  desc: "A 50-LOC retrieval-augmented generation kit you can actually read.", stars: "1.2k", lang: "Go",         langColor: "#51BBD7" },
  { name: "claystack",    glyph: "C", bg: "var(--corgi-orange)", desc: "Opinionated full-stack starter with the clay defaults baked in.",   stars: "642",  lang: "TypeScript", langColor: "#3D768E" },
  { name: "corgictl",     glyph: "K", bg: "var(--hub-green)",    desc: "Friendly kubectl wrapper for tiny homelab clusters.",               stars: "318",  lang: "Rust",       langColor: "#E13429" },
  { name: "pgsmall",      glyph: "P", bg: "var(--deep-teal)",    desc: "Postgres helpers for solo devs — schema migrations + seeds.",       stars: "896",  lang: "Python",     langColor: "#FBC00A" },
  { name: "yt-companion", glyph: "▶", bg: "var(--sky-cyan-deep)", desc: "Notes, code, and timestamps that ship with every video.",          stars: "204",  lang: "MDX",        langColor: "#FC8903" },
  { name: "starry",       glyph: "★", bg: "var(--star-yellow-deep)", desc: "Minimalist OSS launchpad with built-in star tracking.",         stars: "57",   lang: "JS",         langColor: "#FBC00A" },
];

const POSTS = [
  { title: "How I name things in production (and why I get it wrong)", excerpt: "After a decade of shipping, the only naming rule I trust is: re-read it tomorrow. Here's what that actually looks like, with three before/after examples from real PRs.", tag: "Craft", author: "Captain Corgi", date: "Mar 2", read: "8 min", bg: "linear-gradient(135deg,#3D768E,#51BBD7)" },
  { title: "Vector databases for tiny apps",  excerpt: "When you don't need pgvector and when you do.", tag: "AI", author: "Captain Corgi", date: "Feb 21", read: "6 min", bg: "linear-gradient(135deg,#DD5D5D,#E13429)" },
  { title: "Stop scaffolding. Start cooking.", excerpt: "Why 'just use the framework' isn't always the right call.", tag: "Opinion", author: "Captain Corgi", date: "Feb 8",  read: "5 min", bg: "linear-gradient(135deg,#289269,#3BB283)" },
];

const MEMBERS = [
  { name: "Captain Corgi", handle: "captain-corgi", glyph: "🐕", bg: "var(--corgi-orange)", role: "Captain" },
  { name: "First Mate",    handle: "first-mate",    glyph: "M",  bg: "var(--sky-cyan-deep)", role: "Co-host" },
  { name: "Code Cook",     handle: "code-cook",     glyph: "K",  bg: "var(--hub-green)",     role: "Engineer" },
  { name: "Star Painter",  handle: "star-painter",  glyph: "S",  bg: "var(--star-yellow-deep)", role: "Designer" },
  { name: "Anchor Anya",   handle: "anchor",        glyph: "A",  bg: "var(--captain-red)",   role: "Editor" },
  { name: "Pip",           handle: "pip",           glyph: "P",  bg: "var(--petal-pink-deep)", role: "Community" },
];

function App() {
  return (
    <div data-screen-label="Hub">
      <HubNav active="Projects"/>
      <HubHero/>
      <Section id="projects" kicker="Open source" title="Projects we ship">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {PROJECTS.map((p) => <ProjectCard key={p.name} p={p}/>)}
        </div>
      </Section>
      <Section id="blog" kicker="Field notes" title="From the captain's log">
        <div style={{ display: "grid", gap: 20 }}>
          <BlogCard post={POSTS[0]} large/>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <BlogCard post={POSTS[1]}/>
            <BlogCard post={POSTS[2]}/>
          </div>
        </div>
      </Section>
      <Section id="crew" kicker="The Hub crew" title="Six humans and one corgi">
        <MemberGrid members={MEMBERS}/>
      </Section>
      <Footer/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
