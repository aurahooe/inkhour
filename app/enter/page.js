"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "../../lib/supabase";

export default function Enter() {
  const supabase = useMemo(() => getBrowserClient(), []);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("in");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErr(error.message);
      else router.push("/desk");
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setErr(error.message);
      else {
        setMsg("Account saved. If email confirmation is on, check your inbox. Otherwise go to the desk.");
        router.push("/desk");
      }
    }
  }

  return (
    <>
      <header className="mast">
        <div className="wordmark">
          <span>Membership</span>
          InkHour
        </div>
        <nav className="nav">
          <Link href="/">Wall</Link>
          <Link href="/desk">Desk</Link>
        </nav>
      </header>
      <main className="wrap">
        <div className="kicker">{mode === "in" ? "Returning" : "New typesetter"}</div>
        <h1 style={{ fontSize: 48, marginTop: 0 }}>{mode === "in" ? "Sign in" : "Open a desk"}</h1>
        <form onSubmit={submit}>
          <label>
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Password
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {err && <div className="err">{err}</div>}
          {msg && <p>{msg}</p>}
          <div className="row">
            <button type="submit">{mode === "in" ? "Enter" : "Create account"}</button>
            <button type="button" className="btn" style={{ background: "transparent", color: "var(--ink)", border: "1px solid var(--rule)" }} onClick={() => setMode(mode === "in" ? "up" : "in")}>
              {mode === "in" ? "Need a desk?" : "Already have one?"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
