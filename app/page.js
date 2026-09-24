"use client";

import { useEffect, useMemo, useState } from "react";
import { getBrowserClient } from "../lib/supabase";
import Link from "next/link";

export default function Home() {
  const supabase = useMemo(() => getBrowserClient(), []);
  const [hour, setHour] = useState(null);
  const [notes, setNotes] = useState([]);
  const [user, setUser] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    load();
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function load() {
    const { data: hours } = await supabase
      .from("ink_hours")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);
    setHour(hours?.[0] || null);

    const { data: publicNotes } = await supabase
      .from("ink_notes")
      .select("id,title,body,created_at,author_id")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(36);
    setNotes(publicNotes || []);
  }

  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <header className="mast">
        <div className="wordmark">
          <span>A living press</span>
          InkHour
        </div>
        <nav className="nav">
          <Link href="/">Wall</Link>
          <Link href="/desk">Desk</Link>
          {user ? (
            <a href="#" onClick={async (e) => { e.preventDefault(); await supabase.auth.signOut(); }}>Sign out</a>
          ) : (
            <Link href="/enter">Enter</Link>
          )}
        </nav>
      </header>
      <section className="hero">
        <div>
          <div className="kicker">Public slips only</div>
          <h1>What people leave on the paper this hour.</h1>
          <p className="lede">Write privately if you want. Mark a slip public and it hangs on this wall. Every hour the press reprints a dispatch around one of those notes.</p>
        </div>
        <div className="clock">
          <div className="time">{time}</div>
          <div className="sub">Next turn of the press at the top of the hour</div>
        </div>
      </section>
      <section className="edition">
        <div className="motif">{hour?.motif || "quiet hour"}</div>
        <h2>This hour</h2>
        <p>{hour?.dispatch || "The room is still setting type."}</p>
      </section>
      <section className="wall">
        {notes.length === 0 && (
          <article className="slip" style={{ "--tilt": "-1deg" }}>
            <h3>Empty wall</h3>
            <div className="body">No public slips yet. Sit at the desk, write something, and tick public.</div>
          </article>
        )}
        {notes.map((n, i) => (
          <article key={n.id} className="slip" style={{ "--tilt": `${((i % 5) - 2) * 0.6}deg`, animationDelay: `${i * 0.04}s` }}>
            <h3>{n.title || "Untitled slip"}</h3>
            <div className="body">{n.body}</div>
            <div className="meta">{new Date(n.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
          </article>
        ))}
      </section>
    </>
  );
}
