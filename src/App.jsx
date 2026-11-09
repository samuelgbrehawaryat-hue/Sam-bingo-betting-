import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";


export default function App() {
  const [tab, setTab] = useState("home");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => data.subscription.unsubscribe();
  }, []);

  async function signUp() {
    if (!supabase) return setMessage("Supabase አልተዋቀረም።");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password
    });
    setBusy(false);
    setMessage(error ? error.message : "የመመዝገቢያ ጥያቄ ተልኳል።");
  }

  async function signIn() {
    if (!supabase) return setMessage("Supabase አልተዋቀረም።");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setBusy(false);
    setMessage(error ? error.message : "ገብተሃል።");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setTab("home");
    setMessage("ከመለያህ ወጥተሃል።");
  }

  const games = [
    { id: "bingo", name: "BINGO", icon: "🎯", desc: "የBingo ጨዋታ" },
    { id: "keno", name: "KENO", icon: "🎲", desc: "የKeno ጨዋታ" },
    { id: "aviator", name: "AVIATOR", icon: "✈️", desc: "የAviator ጨዋታ" },
    { id: "football", name: "FOOTBALL", icon: "⚽", desc: "የእግር ኳስ" }
  ];

  if (loading) {
    return <main className="shell"><h2>እየጫነ ነው...</h2></main>;
  }

  return (
    <main className="shell">
      <header className="top">
        <div className="brand">
          <span className="mark">S</span>
          <div>
            <b>SAM BINGO</b>
            <small>Games • Community • Competition</small>
          </div>
        </div>
        <span className="status">
          {session ? "PLAYER DASHBOARD" : "STARTER VERSION"}
        </span>
      </header>

      {!session ? (
        <>
          <section className="hero">
            <div className="eyebrow">WELCOME TO THE PLATFORM</div>
            <h1>ጨዋታውን በአንድ ቦታ</h1>
            <p>የSam Bingo Platform የመጀመሪያ የድረገጽ መሠረት።</p>
            <div className="tiles">
              {games.map(game => (
                <button key={game.id} onClick={() => setTab(game.id)}>
                  {game.name}
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>መለያ ፍጠር / ግባ</h2>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="ቢያንስ 6 ቁምፊ"
            />
            <div className="actions">
              <button className="primary" disabled={busy} onClick={signUp}>
                መለያ ፍጠር
              </button>
              <button className="secondary" disabled={busy} onClick={signIn}>
                ግባ
              </button>
            </div>
            {message && <p className="message">{message}</p>}
          </section>
        </>
      ) : (
        <>
          <section className="hero">
            <div className="eyebrow">PLAYER ACCOUNT</div>
            <h1>እንኳን ደህና መጣህ!</h1>
            <p>{session.user.email}</p>
          </section>

          <section className="panel">
            <h2>የተጫዋች ዳሽቦርድ</h2>
            <div className="tiles">
              <div className="panel">
                <h3>ባላንስ</h3>
                <h2>0 ETB</h2>
                <small>የሙከራ ማሳያ ብቻ ነው።</small>
              </div>
            </div>

            <h3>ጨዋታ ምረጥ</h3>
            <div className="tiles">
              {games.map(game => (
                <button
                  key={game.id}
                  onClick={() => setTab(game.id)}
                >
                  {game.icon} {game.name}
                </button>
              ))}
            </div>

            {tab !== "home" && (
              <div className="panel">
                <h2>{games.find(g => g.id === tab)?.name}</h2>
                <p>ይህ የጨዋታ ክፍል በቀጣይ ይገነባል።</p>
                <button onClick={() => setTab("home")}>
                  ወደ ዳሽቦርድ ተመለስ
                </button>
              </div>
            )}

            <button className="secondary" onClick={signOut}>
              ውጣ
            </button>
          </section>
        </>
      )}

      <section className="notice">
        <b>አስፈላጊ ማስታወሻ</b>
        <p>
          ይህ የመጀመሪያ ቴክኒካዊ መሠረት ነው።
          እውነተኛ ገንዘብ ከመጠቀም በፊት
          የደህንነት እና የህግ ፈቃዶች ያስፈልጋሉ።
        </p>
      </section>

      <footer>© 2026 Sam Bingo Platform</footer>
    </main>
  );
}
