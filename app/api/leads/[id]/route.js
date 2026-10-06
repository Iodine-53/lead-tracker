const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE = encodeURIComponent(process.env.AIRTABLE_TABLE || "Lead Table");
const PAT = process.env.AIRTABLE_PAT;

const NEXT_STEP = { New: "Alerted", Alerting: "Alerted", Alerted: "Contacted" };

export async function PATCH(req, { params }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const to = body.status;

  // Read the current status first: only the single forward step is allowed,
  // so a manual write can never skip (or fight) the n8n automation's moves.
  const cur = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${TABLE}/${id}`,
    { headers: { Authorization: `Bearer ${PAT}` }, cache: "no-store" }
  );
  if (!cur.ok) return Response.json({ error: "lead not found" }, { status: 404 });
  const curData = await cur.json();
  const from = curData.fields?.Status || "New";

  if (to !== NEXT_STEP[from]) {
    return Response.json(
      { error: `cannot move ${from} to ${to}`, status: from },
      { status: 409 }
    );
  }

  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${TABLE}/${id}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${PAT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: { Status: to } }),
    }
  );
  if (!res.ok) return Response.json({ error: "airtable update failed" }, { status: 502 });
  const data = await res.json();
  return Response.json({ id: data.id, status: data.fields?.Status });
}
