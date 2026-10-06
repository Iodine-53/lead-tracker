const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE = encodeURIComponent(process.env.AIRTABLE_TABLE || "Lead Table");
const PAT = process.env.AIRTABLE_PAT;

function at(path, init = {}) {
  return fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

const pick = (r) => ({
  id: r.id,
  name: r.fields?.Name || "",
  email: r.fields?.Email || "",
  message: r.fields?.Message || "",
  service: r.fields?.Service || "",
  status: r.fields?.Status || "New",
  created: r.fields?.Created || r.createdTime || "",
});

export async function GET() {
  const res = await at("?maxRecords=100&sort[0][field]=Created&sort[0][direction]=desc");
  if (!res.ok) return Response.json({ error: "airtable read failed" }, { status: 502 });
  const data = await res.json();
  return Response.json({ leads: (data.records || []).map(pick) });
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { name, email, message, service } = body;
  if (!name || !email) return Response.json({ error: "name and email required" }, { status: 400 });
  const res = await at("", {
    method: "POST",
    body: JSON.stringify({
      fields: {
        Name: String(name).slice(0, 200),
        Email: String(email).slice(0, 200),
        Message: String(message || "").slice(0, 2000),
        Service: String(service || "").slice(0, 200),
        Status: "New",
        Created: new Date().toISOString().slice(0, 10),
      },
    }),
  });
  if (!res.ok) return Response.json({ error: "airtable create failed" }, { status: 502 });
  const data = await res.json();
  return Response.json({ lead: pick(data) });
}
