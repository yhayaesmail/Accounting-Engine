# Accounting Engine

A multi-company accounting engine built with Node.js, TypeScript, Express, Prisma, and PostgreSQL. Manages accounts, customers, vendors, invoices, payments, double-entry journal entries, and financial reports — with strict company-level data isolation.

A React + Vite frontend lives in [`frontend/`](frontend/) and talks to this API.

---

## Features

| Area | Capabilities |
|------|-------------|
| **Auth** | Company registration, JWT access/refresh tokens, bcrypt password hashing, login throttling |
| **Chart of accounts** | Account codes, types (Asset/Liability/Equity/Revenue/Expense), currencies, parent/child hierarchy |
| **Customers & Vendors** | Create, read, update, soft-delete |
| **Invoices** | Totals, statuses (DRAFT/SENT/PAID/CANCELLED), customer linking |
| **Payments** | Linked to invoices or unapplied, overpayment protection, auto PAID status |
| **Vendor bills** | Bills per vendor (OPEN → PAID), pay action, soft-delete |
| **Journal entries** | Double-entry validation, DRAFT → POSTED workflow, debit = credit enforcement |
| **Reports** | Dashboard metrics, trial balance from posted entries only |
| **Data safety** | Soft deletes, company-scoped queries, centralized error handling |

---

## Tech Stack

- **Runtime:** Node.js 22+
- **Framework:** Express 5
- **Language:** TypeScript
- **ORM:** Prisma 7
- **Database:** PostgreSQL
- **Cache / sessions:** Redis (optional, in-memory fallback for local dev)
- **Validation:** Joi
- **Auth:** JWT + bcrypt
- **Logging:** Winston
- **Testing:** Vitest

---

## Getting Started

### Prerequisites

- Node.js 22 or newer
- PostgreSQL
- Redis (optional — required for multi-instance deployments)

### Install

```bash
git clone <repository-url>
cd Accounting-Engine
npm install
```

### Configure

```bash
cp .env.example .env
```

Edit `.env` with your values:

```dotenv
PORT=4300
DATABASE_URL="postgresql://postgres:password@localhost:5432/accounting_engine"
JWT_SECRET="replace-with-a-long-random-access-secret"
JWT_REFRESH_SECRET="replace-with-a-long-random-refresh-secret"
REDIS_URL="redis://localhost:6379"
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | HTTP port |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | Signing secret for access tokens |
| `JWT_REFRESH_SECRET` | Yes | — | Signing secret for refresh tokens |
| `REDIS_URL` | No | — | Redis connection URL (optional) |
| `TEST_DATABASE_URL` | No | — | Override the test database used by `npm test` |
| `NODE_ENV` | No | — | Set to `production` to hide stack traces |

### Run

```bash
# Generate Prisma client and apply migrations
npx prisma generate
npx prisma migrate deploy

# Start in development (with hot reload)
npm run dev

# Or start without watching
npm run start:local
```

The API listens at `http://localhost:4300` (or the port in your `.env`).

### Seed (optional)

```bash
npm run seed
```

---

## API Reference

### Authentication

All endpoints except `/api/auth/*` require a bearer token:

```http
Authorization: Bearer <accessToken>
```

### Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/auth/register-company` | Public | Register company + admin user |
| `POST` | `/api/auth/login` | Public | Sign in, get tokens |
| `POST` | `/api/auth/refresh` | Public | Refresh access token |
| `POST` | `/api/auth/logout` | Bearer | Log out |
| `GET` | `/api/accounts` | Bearer | List chart of accounts |
| `POST` | `/api/accounts` | Bearer | Create an account |
| `GET` | `/api/accounts/:id` | Bearer | Get one account |
| `PATCH` | `/api/accounts/:id` | Bearer | Update an account |
| `DELETE` | `/api/accounts/:id` | Bearer | Soft-delete an account |
| `GET` | `/api/customers` | Bearer | List customers |
| `POST` | `/api/customers` | Bearer | Create a customer |
| `GET` | `/api/customers/:id` | Bearer | Get one customer |
| `PATCH` | `/api/customers/:id` | Bearer | Update a customer |
| `DELETE` | `/api/customers/:id` | Bearer | Soft-delete a customer |
| `GET` | `/api/vendors` | Bearer | List vendors |
| `POST` | `/api/vendors` | Bearer | Create a vendor |
| `GET` | `/api/vendors/:id` | Bearer | Get one vendor |
| `PATCH` | `/api/vendors/:id` | Bearer | Update a vendor |
| `DELETE` | `/api/vendors/:id` | Bearer | Soft-delete a vendor |
| `GET` | `/api/invoices` | Bearer | List invoices |
| `POST` | `/api/invoices` | Bearer | Create an invoice |
| `GET` | `/api/invoices/:id` | Bearer | Get one invoice |
| `PATCH` | `/api/invoices/:id` | Bearer | Update an invoice |
| `DELETE` | `/api/invoices/:id` | Bearer | Soft-delete an invoice |
| `GET` | `/api/payments` | Bearer | List payments |
| `POST` | `/api/payments` | Bearer | Record a payment |
| `GET` | `/api/payments/:id` | Bearer | Get one payment |
| `DELETE` | `/api/payments/:id` | Bearer | Soft-delete a payment |
| `GET` | `/api/vendor-bills` | Bearer | List vendor bills |
| `POST` | `/api/vendor-bills` | Bearer | Create a vendor bill |
| `POST` | `/api/vendor-bills/:id/pay` | Bearer | Mark a bill as paid |
| `DELETE` | `/api/vendor-bills/:id` | Bearer | Soft-delete a bill |
| `GET` | `/api/journal` | Bearer | List journal entries (paginated) |
| `POST` | `/api/journal` | Bearer | Create a draft journal entry |
| `PATCH` | `/api/journal/:id/post` | Bearer | Post a draft entry |
| `GET` | `/api/journal/:id` | Bearer | Get one journal entry |
| `DELETE` | `/api/journal/:id` | Bearer | Soft-delete a journal entry |
| `GET` | `/api/reports/dashboard` | Bearer | Dashboard metrics |
| `GET` | `/api/reports/trial-balance` | Bearer | Trial balance from posted entries |

### Example: Register and create a journal entry

```bash
BASE=http://localhost:4300

# 1. Register
curl -s -X POST "$BASE/api/auth/register-company" \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Acme Inc.","email":"admin@acme.com","password":"change-me-123"}'

# 2. Login and capture the token
TOKEN=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"change-me-123"}' \
  | jq -r '.data.tokens.accessToken')

# 3. Create an account
curl -s -X POST "$BASE/api/accounts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Cash","code":"1000","type":"ASSET","currency":"USD"}'

# 4. Create a balanced journal entry
curl -s -X POST "$BASE/api/journal" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Owner investment",
    "transactions": [
      { "accountId": "<cash-account-id>", "debit": 1000 },
      { "accountId": "<equity-account-id>", "credit": 1000 }
    ]
  }'
```

---

## Accounting Rules

- **Company isolation:** Every query is filtered by the company ID from the JWT. Records from other companies are never visible.
- **Soft deletes:** `DELETE` sets `deletedAt` instead of removing the row. Deleted records are excluded from all reads and reports.
- **Journal entries:** Must have at least 2 lines. Each line has exactly one debit or credit (not both, not neither). Amounts cannot be negative. Total debits must equal total credits. New entries are `DRAFT`; only a `POST` action moves them to `POSTED`.
- **Payments:** A payment linked to an invoice cannot push cumulative payments above the invoice total. When cumulative payments equal the total, the invoice is marked `PAID`.

---

## Testing

```bash
npm test
```

- **Unit tests** (mocked Prisma, no database required): journal service, invoice service, payment service, vendor bill service.
- **Integration tests** (require a test database): authentication flows, login throttling, refresh, logout.

> Integration tests run against an isolated database (your dev database's name + `_test`, created automatically) with an in-memory Redis fallback. Your original database and Redis are never touched by the suite. Set `TEST_DATABASE_URL` in `.env` to point the tests somewhere specific.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with `tsx watch` (hot reload) |
| `npm run start:local` | Start TypeScript server without watching |
| `npm run build` | Clean `dist`, generate Prisma client, compile TypeScript |
| `npm start` | Apply migrations and run the compiled server |
| `npm test` | Run the Vitest suite once |
| `npm run seed` | Create a sample company record |
| `npm run clean` | Remove the `dist` directory |

---

## Deployment

1. Provision PostgreSQL (and Redis for multi-instance).
2. Set all required environment variables on the host.
3. Build and start:

   ```bash
   npm ci
   npm run build
   npm start
   ```

`npm start` runs `prisma migrate deploy` before launching `dist/server.js`.

**Operational notes:**
- Run behind a reverse proxy or load balancer.
- Use Redis when running more than one instance (in-memory sessions are not shared).
- Ensure the process can write to `logs/` (Winston writes `error.log` and `combined.log`).
- Enable TLS at the proxy level and use managed secrets for JWT keys.

---

## License

ISC. See `package.json` for details.
