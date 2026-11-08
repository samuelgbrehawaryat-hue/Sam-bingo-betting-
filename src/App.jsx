import { useState } from "react";
import { supabase } from "./supabase.js";

export default function App() {
  const [tab, setTab] = useState("home");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function signUp() {
    if (!supabase) {
      return setMessage("መጀመሪያ Supabase URL/Key አስገባ።");
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    setMessage(error ? error.message : "የመመዝገቢያ ጥያቄ ተልኳል።");
  }

  async function signIn() {
    if (!supabase) return setMessage("Supabase ገና አልተዋቀረም።");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setBusy(false);
    setMessage(error ? error.message : "ገብተሃል።");
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
        <span className="status">STARTER VERSION</span>
      </header>

      <section className="hero">
        <div className="eyebrow">WELCOME TO THE PLATFORM</div>
        <h1>ጨዋታውን በአንድ ቦታ</h1>
        <p>የSam Bingo Platform የመጀመሪያ የድረገጽ መሠረት።</p>

        <div className="tiles">
          <button onClick={() => setTab("bingo")}>Bingo</button>
          <button onClick={() => setTab("keno")}>Keno</button>
          <button onClick={() => setTab("aviator")}>Aviator</button>
          <button onClick={() => setTab("football")}>Football</button>
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

      <section className="notice">
        <b>አስፈላጊ ማስታወሻ</b>
        <p>ይህ የመጀመሪያ ቴክኒካዊ መሠረት ነው። እውነተኛ ገንዘብ ከመጠቀም በፊት የደህንነት እና የህግ ፈቃዶች ያስፈልጋሉ።</p>
      </section>

      <footer>© 2026 Sam Bingo Platform</footer>
    </main>
  );
}
