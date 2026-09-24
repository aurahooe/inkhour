"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "../../lib/supabase";

export default function Desk() {
  const supabase = useMemo(() => getBrowserClient(), []);
  const router = useRouter();
  const [user, setUser] = useState(undefined);
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/enter");
      else {
        setUser(data.user);
        load(data.user.id);
      }
    });
  }, [supabase, router]);

  async function load(id) {
    const { data } = await supabase.from("ink_notes").select("*").eq("author_id", id).order("created_at", { ascending: false });
    setNotes(data || []);
  }

  async function save(e) {
    e.preventDefault();
    setErr("");
    if (!user) return;
    const { error } = await supabase.from("ink_notes").insert({
      author_id: user.id,
      title: title.trim(),
      body: body.trim(),
      is_public: isPublic,
    });
    if (error) { setErr(error.message); return; }
    setTitle("");
    setBody("");
    setIsPublic(false);
    load(user.id);
  }

  async function togglePublic(note) {
    await supabase.from("ink_notes").update({ is_public: !note.is_public, updated_at: new Date().toISOString() }).eq("id", note.id);
    load(user.id);
  }

  async function remove(id) {
    await supabase.from("ink_notes").delete().eq("id", id);
    load(user.id);
  }

  if (user === undefined) return null;

  return (
    <>
      <header className="mast">
        <div className="wordmark">
          <span>Private + public</span>
          Desk
        </div>
        <nav className="nav">
          <Link href="/">Wall</Link>
          <a href="#" onClick={async (e) => { e.preventDefault(); await supabase.auth.signOut(); router.push("/"); }}>Sign out</a>
        </nav>
      </header>
      <main className="wrap">
        <h1 style={{ fontSize: 48, marginTop: 0 }}>Write a slip</h1>
        <p className="lede">Kept private unless you mark it public. Public slips appear on the wall for anyone.</p>
        <form onSubmit={save} style={{ marginTop: 24 }}>
          <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A short heading" /></label>
          <label>Body<textarea value={body} onChange={(e) => setBody(e.target.value)} required placeholder="What happened, or what you noticed." /></label>
          <label className="check">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            Show this on the public wall
          </label>
          {err && <div className="err">{err}</div>}
          <button type="submit">File the slip</button>
        </form>
        <h2 style={{ marginTop: 48 }}>Your drawer</h2>
        <div className="wall" style={{ padding: "12px 0 0" }}>
          {notes.map((n, i) => (
            <article key={n.id} className="slip" style={{ "--tilt": `${((i % 3) - 1) * 0.4}deg` }}>
              <h3>{n.title || "Untitled"}</h3>
              <div className="body">{n.body}</div>
              <div className="meta">{n.is_public ? "Public" : "Private"}</div>
              <div className="row" style={{ marginTop: 12 }}>
                <button type="button" onClick={() => togglePublic(n)}>{n.is_public ? "Make private" : "Make public"}</button>
                <button type="button" style={{ background: "transparent", color: "var(--ink)", border: "1px solid var(--rule)" }} onClick={() => remove(n.id)}>Destroy</button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
