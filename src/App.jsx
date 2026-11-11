import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";
import Football from './Football.jsx';
import Wallet from './Wallet.jsx';

export default function App() {
  const [tab, setTab] = useState("home");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState([]);
  const [playersError, setPlayersError] = useState("");

  // 1. የተጠቃሚ መግቢያ ሁኔታን መከታተል
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

  // 2. አስተዳዳሪ መሆኑን ማረጋገጥ
  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      if (!session?.user?.id || !supabase) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (active) {
        setIsAdmin(!error && !!data);
      }
    }

    checkAdmin();

    return () => {
      active = false;
    };
  }, [session]);

  // 3. የተመዘገቡ ተጫዋቾችን መጫን (ለ Admin)
  useEffect(() => {
    if (!isAdmin || !supabase) {
      setPlayers([]);
      return;
    }

    async function loadPlayers() {
      const { data, error } = await supabase
        .from("profiles")
        .select("public_user_id, display_name, email, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        setPlayersError(error.message);
        return;
      }

      setPlayersError("");
      setPlayers(data || []);
    }

    loadPlayers();
  }, [isAdmin]);

  async function signUp() {
    if (!supabase) return setMessage("Supabase አልተዋቀረም።");
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    setMessage(error ? error.message : "የመመዝገቢያ ጥያቄ ተልኳል።");
  }

  async function signIn() {
    if (!supabase) return setMessage("Supabase አልተዋቀረም።");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
    return (
      <main className="shell">
        <h2>እየጫነ ነው...</h2>
      </main>
    );
  }

  // ==========================================
  // የመግቢያ ገጽ (ካልገባ)
  // ==========================================
  if (!session) {
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
          <span className="status">STARTER VERSION</span>
        </header>

        <section className="hero">
          <div className="eyebrow">WELCOME TO THE PLATFORM</div>
          <h1>ጨዋታውን በአንድ ቦታ</h1>
          <p>የSam Bingo Platform የመጀመሪያ የድረገጽ መሠረት።</p>
        </section>

        <section className="panel">
          <h2>መለያ ፍጠር / ግባ</h2>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="ቢያንስ 6 ቁምፊ" />
          <div className="actions">
            <button className="primary" disabled={busy} onClick={signUp}>መለያ ፍጠር</button>
            <button className="secondary" disabled={busy} onClick={signIn}>ግባ</button>
          </div>
          {message && <p className="message">{message}</p>}
        </section>
      </main>
    );
  }

  // ==========================================
  // ዋናው ዳሽቦርድ (ከገባ በኋላ)
  // ==========================================
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
        <span className="status">PLAYER DASHBOARD</span>
      </header>

      <section className="hero">
        <div className="eyebrow">PLAYER ACCOUNT</div>
        <h1>እንኳን ደህና መጣህ!</h1>
        <p>{session.user.email}</p>
      </section>

      {/* የታብ መቀየሪያ ቁልፎች */}
      <div style={{ display: 'flex', gap: '10px', margin: '20px 0', flexWrap: 'wrap' }}>
        <button onClick={() => setTab("home")} style={{ padding: '10px 20px', backgroundColor: tab === 'home' ? '#4CAF50' : '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>🏠 Home</button>
        <button onClick={() => setTab("football")} style={{ padding: '10px 20px', backgroundColor: tab === 'football' ? '#4CAF50' : '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>⚽ Football</button>
        <button onClick={() => setTab("wallet")} style={{ padding: '10px 20px', backgroundColor: tab === 'wallet' ? '#4CAF50' : '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>💰 Wallet</button>
        <button onClick={signOut} style={{ padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>ውጣ</button>
      </div>

      {/* --- የየገጹ ይዘት --- */}

      {tab === "home" && (
        <>
          {/* Admin Panel (ለአስተዳዳሪ ብቻ የሚታይ) */}
          {isAdmin && (
            <section className="panel" style={{ backgroundColor: '#1e1e1e', border: '1px solid #e94560' }}>
              <h2 style={{ color: '#e94560' }}>👑 ADMIN PANEL</h2>
              <p>የባለቤት መቆጣጠሪያ ክፍል</p>
              <h3>የተመዘገቡ ተጫዋቾች</h3>
              {playersError && <p className="message">{playersError}</p>}
              {players.length === 0 ? <p>ምንም ተጫዋች አልተገኘም።</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {players.map((player, index) => (
                    <div className="panel" key={player.public_user_id}>
                      <h4>ተጫዋች #{index + 1}</h4>
                      <p>መለያ: {player.public_user_id}</p>
                      <p>ስም: {player.display_name || "አልተገለጸም"}</p>
                      <p>Email: {player.email || "የለም"}</p>
                      <small>የተመዘገበበት: {new Date(player.created_at).toLocaleString()}</small>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Player Dashboard */}
          <section className="panel">
            <h2>የተጫዋች ዳሽቦርድ</h2>
            <div className="tiles">
              <div className="panel">
                <h3>ባላንስ</h3>
                <h2>0 ETB</h2>
                <small>ከWallet ገጽ ያስተካክሉ</small>
              </div>
            </div>

            <h3>ጨዋታ ምረጥ</h3>
            <div className="tiles">
              {games.map(game => (
                <button key={game.id} onClick={() => setTab(game.id)} style={{ padding: '15px', fontSize: '16px' }}>
                  {game.icon} {game.name}
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {tab === "football" && <Football user={session.user} />}
      {tab === "wallet" && <Wallet user={session.user} />}

      {/* ለተቀሩት ጨዋታዎች (Bingo, Keno, Aviator) */}
      {["bingo", "keno", "aviator"].includes(tab) && (
        <div className="panel">
          <h2>{games.find(g => g.id === tab)?.name}</h2>
          <p>ይህ የጨዋታ ክፍል በቀጣይ ይገነባል።</p>
          <button onClick={() => setTab("home")}>ወደ ዳሽቦርድ ተመለስ</button>
        </div>
      )}

      <section className="notice">
        <b>አስፈላጊ ማስታወሻ</b>
        <p>ይህ የመጀመሪያ ቴክኒካዊ መሠረት ነው። እውነተኛ ገንዘብ ከመጠቀም በፊት የደህንነት እና የህግ ፈቃዶች ያስፈልጋሉ።</p>
      </section>

      <footer>© 2026 Sam Bingo Platform</footer>
    </main>
  );
}
