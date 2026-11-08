import { useState } from "react";
import { supabase } from "./supabase.js";

export default function App() {
  const [tab, setTab] = useState("home");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function signUp() {
    if (!supabase) return setMessage("መጀመሪያ .env ፋይል አዘጋጅና Supabase URL/Key አስገባ።");
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    setMessage(error ? error.message : "የመመዝገቢያ ጥያቄ ተልኳል። ኢሜይልህን አረጋግጥ።");
  }

  async function signIn() {
    if (!supabase) return setMessage("Supabase ገና አልተዋቀረም።");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    setMessage(error ? error.message : "ገብተሃል። ገጹን አድስ።");
  }

  return <main className="shell">
    <header className="top">
      <div className="brand"><span className="mark">S</span><div><b>SAM BINGO</b><small>Games • Community • Competition</small></div></div>
      <span className="status">STARTER VERSION</span>
    </header>
    <section className="hero">
      <div className="eyebrow">WELCOME TO THE PLATFORM</div>
      <h1>ጨዋታውን በአንድ ቦታ</h1>
      <p>የSam Bingo Platform የመጀመሪያ የድረገጽ መሠረት። መለያ መፍጠር፣ መግባት እና የጨዋታ ገጾችን በቀጣይ ማከል ይቻላል።</p>
      <div className="tiles">
        <button onClick={() => setTab("bingo")}> <strong>01</strong><b>Bingo</b><small>Coming next</small></button>
        <button onClick={() => setTab("keno")}><strong>02</strong><b>Keno</b><small>Coming next</small></button>
        <button onClick={() => setTab("aviator")}><strong>03</strong><b>Aviator</b><small>Coming next</small></button>
        <button onClick={() => setTab("football")}><strong>04</strong><b>Football</b><small>Coming next</small></button>
      </div>
    </section>
    <section className="panel">
      <div className="panel-head"><div><span className="eyebrow">ACCOUNT</span><h2>መለያ ፍጠር / ግባ</h2></div><span className="lock">🔐</span></div>
      <label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com"/>
      <label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="ቢያንስ 6 ቁምፊ"/>
      <div className="actions"><button className="primary" disabled={busy} onClick={signUp}>መለያ ፍጠር</button><button className="secondary" disabled={busy} onClick={signIn}>ግባ</button></div>
      {message && <p className="message">{message}</p>}
    </section>
    <section className="notice"><b>አስፈላጊ ማስታወሻ</b><p>ይህ የመጀመሪያ ቴክኒካዊ መሠረት ነው። እውነተኛ ገንዘብ፣ የተጠቃሚ Wallet፣ ክፍያ፣ ውርድ እና የአስተዳዳሪ ፈቃድ ከመጠቀም በፊት በBackend እና Database ላይ በደህንነት መገንባት አለባቸው። አሁን ገንዘብ አታስገባ።</p></section>
    <footer>© 2026 Sam Bingo Platform <span>Built step by step</span></footer>
  </main>;
}
