# Lead Tracker

**Live demo:** https://checkma8t-leads.vercel.app

A kanban-style lead status board that stays in sync with Airtable. Day 3 of a 30-day build-in-public series on automating small-business busywork.

New leads land in the **New** column — click them along to **Alerted** then **Contacted**. A stats row shows total leads, per-status counts, and contacted rate at a glance. No more leads rotting in a spreadsheet tab nobody opens.

## Stack

- **Next.js 15** (App Router) + **React 19** — board UI and API routes
- **Airtable** — lead data store (source of truth)
- **n8n** — automation firing Telegram/Slack alerts on new leads; the board's status moves reconcile with it

## How it works

- `GET /api/leads` — lists leads from the Airtable Lead Table
- `POST /api/leads` — creates a lead with `Status=New`
- `PATCH /api/leads/[id]` — advances status; only forward moves allowed (`New→Alerted`, `Alerted→Contacted`, `Alerting→Alerted`), anything else gets a 409 so the UI can't fight the n8n automation
- The board polls `/api/leads` every 10s and refetches after every PATCH

## Run it

```bash
npm install
cp .env.local.example .env.local  # then fill in your keys
npm run dev
```

## Env vars

| Var | Purpose |
|---|---|
| `AIRTABLE_PAT` | Personal access token (server-side only, never shipped to the client) |
| `AIRTABLE_BASE_ID` | Base ID, e.g. `app…` |
| `AIRTABLE_TABLE` | Table name (default: `Lead Table`) |
