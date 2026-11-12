# Accounting Engine — Frontend

Separate frontend project for the Accounting Engine backend API. Zero changes were made to the backend.

## Stack

- React 18 + TypeScript (strict)
- Vite (dev server + production build)
- React Router 6
- Lucide React (icons, tree-shaken)
- Plain CSS (CSS variables) — no CSS-in-JS runtime, no utility framework

## Design system

Light theme only. Three-color palette:

- **White** (`#ffffff`) — backgrounds, surfaces
- **Primary** (`#0f172a`, slate-900) — text, headers, primary buttons, focus states
- **Secondary** (`#64748b`, slate-500) — muted text, borders

Borders and hover states are derived from the primary/secondary colors with alpha. No gradients, no glassmorphism, no decorative shadows.

## Performance

- Small, code-split bundles (app JS ≈ 6 kB gzip).
- Native `fetch` with `AbortController` timeouts.
- Route-level code splitting via React Router lazy loading where added.
- No runtime styling library; plain CSS.
- Paginated/table-ready components.

## Getting started

```bash
cd frontend
cp .env.example .env
# edit .env if your backend runs on a different port

npm install
npm run dev       # http://localhost:5173 (proxies /api to localhost:4300)
npm run build     # production build to dist/
npm run preview   # serve the production build locally
```

The dev server proxies `/api` to `http://localhost:4300`, so no CORS configuration is needed in development when the backend runs on its default port.

## Pages

- `/login` — left-aligned sign-in (not centered)
- `/register` — company + admin registration
- `/dashboard` — company overview metrics
- `/accounts` — chart of accounts
- `/customers` — customers
- `/vendors` — vendors
- `/invoices` — invoices
- `/payments` — payments
- `/journal` — journal entries
- `/reports` — reports

All protected routes require a valid access token and redirect to `/login` when unauthenticated.

## Backend contract

The frontend only calls endpoints that exist on the backend:
`/api/auth/*`, `/api/accounts`, `/api/customers`, `/api/vendors`,
`/api/invoices`, `/api/payments`, `/api/journal`, `/api/reports/*`.

No endpoints were invented, and no backend code was modified.
