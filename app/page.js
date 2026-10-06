"use client";
import { useCallback, useEffect, useState } from "react";
import "./globals.css";

const COLS = [
  { key: "New", title: "New" },
  { key: "Alerted", title: "Alerted" },
  { key: "Contacted", title: "Contacted" },
];
const NEXT_LABEL = { New: "Mark alerted", Alerted: "Mark contacted" };
const NEXT_STATUS = { New: "Alerted", Alerted: "Contacted" };

function Card({ lead, onAdvance, busy }) {
  const alerting = lead.status === "Alerting";
  return (
    <div className="card">
      <div className="name">{lead.name || "—"}</div>
      {lead.service ? <div className="svc">{lead.service}</div> : null}
      {lead.message ? <p className="msg">{lead.message}</p> : null}
      <div className="meta">{lead.email}</div>
      <div className="row">
        {NEXT_STATUS[lead.status] && !alerting ? (
          <button
            className="btn-advance"
            disabled={busy}
            onClick={() => onAdvance(lead.id, NEXT_STATUS[lead.status])}
          >
            {NEXT_LABEL[lead.status]}
          </button>
        ) : null}
        {alerting ? <span className="badge-alerting">sending alerts…</span> : null}
      </div>
    </div>
  );
}

export default function Page() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", service: "", message: "" });
  const [saved, setSaved] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/leads", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "load failed");
      setLeads(d.leads || []);
      setErr("");
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  async function advance(id, status) {
    setBusy(true);
    try {
      const r = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error("update failed");
      await load();
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function addLead(e) {
    e.preventDefault();
    setBusy(true);
    setSaved("");
    try {
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "save failed");
      setForm({ name: "", email: "", service: "", message: "" });
      setSaved("lead saved — it is on the board.");
      await load();
    } catch (e2) {
      setErr(String(e2.message || e2));
    } finally {
      setBusy(false);
    }
  }

  const inCol = (key) =>
    leads.filter((l) => (key === "New" ? l.status === "New" || l.status === "Alerting" : l.status === key));
  const total = leads.length;
  const contacted = leads.filter((l) => l.status === "Contacted").length;
  const rate = total ? Math.round((contacted / total) * 100) : 0;

  return (
    <div className="wrap">
      <header className="top">
        <h1>Lead Tracker</h1>
        <span className="live"><span className="dot" /> live from Airtable</span>
      </header>
      <p className="sub">every lead, one board. new leads land here, you move them along.</p>

      <div className="stats">
        <div className="stat"><div className="n">{total}</div><div className="l">total leads</div></div>
        <div className="stat"><div className="n">{inCol("New").length}</div><div className="l">new</div></div>
        <div className="stat"><div className="n">{inCol("Alerted").length}</div><div className="l">alerted</div></div>
        <div className="stat"><div className="n">{contacted}</div><div className="l">contacted</div></div>
        <div className="stat"><div className="n">{rate}%</div><div className="l">contacted rate</div></div>
      </div>

      {loading ? <p className="empty">loading leads…</p> : (
        <div className="board">
          {COLS.map((c) => {
            const items = inCol(c.key);
            return (
              <div className="col" key={c.key}>
                <h2>{c.title} <span className="count">{items.length}</span></h2>
                {items.length === 0 ? <p className="empty">nothing here</p> : null}
                {items.map((l) => <Card key={l.id} lead={l} onAdvance={advance} busy={busy} />)}
              </div>
            );
          })}
        </div>
      )}

      <form className="form" onSubmit={addLead}>
        <h2>Add a lead</h2>
        <div className="grid">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Service (e.g. Automation)" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} />
          <textarea placeholder="What do they need?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
        <div className="foot">
          <span className="hint">{saved || "lands in Airtable as New, alerts fire automatically."}</span>
          <button className="btn-add" disabled={busy} type="submit">Add lead</button>
        </div>
      </form>
      {err ? <p className="err">{err}</p> : null}
    </div>
  );
}
