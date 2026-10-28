# Accounting Engine — Web

The web client for the Accounting Engine API. Next.js App Router, TypeScript, and plain CSS.

## Run it

```bash
npm install
npm run dev
```

The app starts at `http://localhost:3000`. All `/api/*` requests are proxied to
`http://localhost:4300` by `next.config.ts`, so the API can keep its existing
CORS configuration.

To point at a different API host, create `frontend/.env.local`:

```dotenv
API_ORIGIN=http://localhost:4300
```

## What it talks to

The interface uses only existing API routes:

- Auth: register company, login, refresh, logout
- Accounts, customers, vendors
- Invoices and payments
- Journal entries, posting, pagination
- Dashboard and trial balance reports

Amounts are displayed in USD. Invoice line items and currencies are not part of
the current API, so the invoices screen shows invoice-level totals and payments.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server. |
| `npm run build` | Production build. |
| `npm start` | Serve the production build (requires a running API). |
| `npm run typecheck` | Run TypeScript without emitting. |
