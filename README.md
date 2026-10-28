# Accounting Engine

A multi-company accounting API built with Node.js, Express, TypeScript, Prisma, and PostgreSQL. It covers company onboarding, JWT authentication, a chart of accounts, customers, vendors, invoices, payments, double-entry journal entries, and financial reporting.

> **Scope:** This repository contains the backend API only. No web client is bundled.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [API Reference](#api-reference)
- [Accounting Rules](#accounting-rules)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [License](#license)

## Overview

Small businesses often start with spreadsheets and outgrow them once invoices, payments, and journal entries need to stay consistent and auditable. Accounting Engine models those workflows behind a validated REST API with strict company-level data isolation.

The service is organized by business domain. Each module owns its routes, request validation, HTTP handlers, and business logic, while shared middleware handles authentication and errors.

## Features

- Company registration with an admin user in a single transaction.
- Access and refresh tokens with server-side refresh-token validation.
- Optional Redis-backed sessions and login throttling, with an in-memory fallback for local development.
- Company-scoped chart of accounts with codes, account types, currencies, and parent/child hierarchy.
- Customer and vendor management.
- Invoices with statuses, issue dates, and customer details.
- Payments applied to invoices or recorded as unapplied credit.
- Double-entry journal entries with debit/credit validation and a separate posting step.
- Trial balance and dashboard reporting.
- Soft deletion across operational records.
- Centralized validation, error handling, and structured logging.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js 22+ |
| Framework | Express 5 |
| Language | TypeScript |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Cache / sessions | Redis (optional) |
| Validation | Joi |
| Authentication | JSON Web Tokens, bcrypt |
| Logging | Winston |
| Testing | Vitest |

## Architecture

```text
src/
├── app.ts                    # Express application and route registration
├── server.ts                 # HTTP server bootstrap
├── config/                   # Environment, Prisma, and Redis clients
├── middlewares/              # Authentication, role guard, error handling
├── modules/
│   ├── auth/                 # Registration, login, refresh, logout
│   ├── accounts/             # Chart of accounts
│   ├── customers/            # Customer records
│   ├── vendors/              # Vendor records
│   ├── invoices/             # Invoices and status handling
│   ├── payments/             # Invoice and unapplied payments
│   ├── journal/              # Double-entry journal and posting
│   └── reports/              # Dashboard and trial balance
├── generated/prisma/         # Generated Prisma client (gitignored)
├── types/                    # Shared TypeScript types
├── utils/                    # JWT, hashing, errors, logger
└── seed/                     # Optional database seed script

prisma/
├── schema.prisma
└── migrations/
```

Each domain module follows the same flow:

```text
route → authentication → controller → Joi validation → service → Prisma → PostgreSQL
```

Business rules live in the service layer so they apply regardless of the caller. Controllers are limited to HTTP concerns, and routes only wire middleware and handlers.

## Getting Started

### Prerequisites

- Node.js 22 or newer
- npm
- PostgreSQL
- Redis (optional, recommended for production)

### Installation

1. Clone the repository and enter the project directory:

   ```bash
   git clone <repository-url>
   cd Accounting-Engine
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create your environment file:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Fill in the required values in `.env`. See [Configuration](#configuration).

5. Generate the Prisma client and apply migrations:

   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

   During local schema development, use `npx prisma migrate dev` instead of `migrate deploy`.

6. Start the development server:

   ```bash
   npm run dev
   ```

7. The API is available at `http://localhost:4300` when using the provided `.env.example`. Without a `PORT` override, it listens on `3000`.

## Configuration

The application fails at startup if a required variable is missing.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `PORT` | No | `3000` | HTTP port. `.env.example` uses `4300`. |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string. |
| `JWT_SECRET` | Yes | — | Signing secret for 15-minute access tokens. |
| `JWT_REFRESH_SECRET` | Yes | — | Signing secret for 7-day refresh tokens. |
| `REDIS_URL` | No | — | Redis connection URL for sessions and login throttling. |
| `NODE_ENV` | No | — | Set to `production` to omit stack traces from error responses. |

Example:

```dotenv
PORT=4300
DATABASE_URL="postgresql://postgres:password@localhost:5432/accounting_engine"
JWT_SECRET="replace-with-a-long-random-access-secret"
JWT_REFRESH_SECRET="replace-with-a-long-random-refresh-secret"
REDIS_URL="redis://localhost:6379"
```

When `REDIS_URL` is omitted, the API uses an in-process memory store. This is convenient for local development, but sessions are lost on restart and are not shared across multiple instances. Use Redis in any multi-instance deployment.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with `tsx watch`. |
| `npm run start:local` | Run the TypeScript entry point without watching. |
| `npm run build` | Clean `dist`, generate the Prisma client, and compile TypeScript. |
| `npm start` | Apply pending migrations and run the compiled server. |
| `npm test` | Run the Vitest suite once. |
| `npm run seed` | Create a sample company record. |
| `npm run clean` | Remove the `dist` directory. |

## API Reference

### Base URL and format

```text
http://localhost:4300
```

All requests and responses use JSON. Send `Content-Type: application/json` with request bodies.

### Authentication

All routes except the public authentication endpoints require a bearer token:

```http
Authorization: Bearer <accessToken>
```

Access tokens expire after **15 minutes**. Refresh tokens expire after **7 days** and are validated against the stored session. Logging out deletes the stored refresh token; already-issued access tokens remain valid until they expire.

### Response envelope

Successful responses:

```json
{
  "success": true,
  "data": {}
}
```

Errors:

```json
{
  "success": false,
  "message": "Description of the error"
}
```

A stack trace is included only when `NODE_ENV` is not `production`.

| Status | Meaning |
| --- | --- |
| `200` | Request completed. |
| `201` | Resource created. |
| `400` | Validation error or invalid operation. |
| `401` | Missing, invalid, or expired token; invalid credentials. |
| `403` | Authenticated but not permitted. |
| `404` | Resource not found in the caller's company. |
| `409` | Conflict, such as a duplicate account code or an overpayment. |
| `500` | Unexpected server error. |

### Authentication endpoints

| Method | Endpoint | Body | Access |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register-company` | `companyName`, `email`, `password` | Public |
| `POST` | `/api/auth/login` | `email`, `password` | Public |
| `POST` | `/api/auth/refresh` | `refreshToken` | Public |
| `POST` | `/api/auth/logout` | — | Bearer token |

Registration creates the company and its `COMPANY_ADMIN` user in one transaction, then returns both tokens. Emails and company names are normalized to lowercase.

Login accepts up to five failed attempts per email in a rolling 60-second window. A successful login clears the counter.

### Resource endpoints

Every endpoint below requires a bearer token and is scoped to the authenticated user's company.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/accounts` | List accounts ordered by code, including children. |
| `GET` | `/api/accounts/:id` | Get one account with children and transactions. |
| `POST` | `/api/accounts` | Create an account (`name`, `code`, `type`, optional `currency`, `parentId`). |
| `PATCH` | `/api/accounts/:id` | Update an account. |
| `DELETE` | `/api/accounts/:id` | Soft-delete an account. |
| `GET` | `/api/customers` | List customers, newest first. |
| `GET` | `/api/customers/:id` | Get a customer with their invoices. |
| `POST` | `/api/customers` | Create a customer (`name`, optional `email`). |
| `PATCH` | `/api/customers/:id` | Update a customer. |
| `DELETE` | `/api/customers/:id` | Soft-delete a customer. |
| `GET` | `/api/vendors` | List vendors, newest first. |
| `GET` | `/api/vendors/:id` | Get one vendor. |
| `POST` | `/api/vendors` | Create a vendor (`name`, optional `contact`). |
| `PATCH` | `/api/vendors/:id` | Update a vendor. |
| `DELETE` | `/api/vendors/:id` | Soft-delete a vendor. |
| `GET` | `/api/invoices` | List invoices by issue date, newest first, with customer and payments. |
| `GET` | `/api/invoices/:id` | Get one invoice with customer and payments. |
| `POST` | `/api/invoices` | Create an invoice (`customerId`, `total`, optional `status`, `issuedAt`). |
| `PATCH` | `/api/invoices/:id` | Update total, status, or issue date. |
| `DELETE` | `/api/invoices/:id` | Soft-delete an invoice. |
| `GET` | `/api/payments` | List payments, newest first, with invoice details. |
| `GET` | `/api/payments/:id` | Get one payment. |
| `POST` | `/api/payments` | Record a payment (`amount`, `method`, optional `invoiceId`). |
| `DELETE` | `/api/payments/:id` | Soft-delete a payment. |
| `GET` | `/api/journal` | List journal entries. Supports `page` and `limit`. |
| `GET` | `/api/journal/:id` | Get one journal entry with its lines. |
| `POST` | `/api/journal` | Create a draft journal entry. |
| `PATCH` | `/api/journal/:id/post` | Post a draft entry to the ledger. |
| `DELETE` | `/api/journal/:id` | Soft-delete a journal entry. |
| `GET` | `/api/reports/dashboard` | Aggregate account, customer, invoice, payment, and journal counts and totals. |
| `GET` | `/api/reports/trial-balance` | Debit, credit, and balance per account from posted entries. |

#### Journal pagination

`GET /api/journal` defaults to page `1` and limit `10`. Its `data` object contains both the entries and pagination metadata:

```json
{
  "success": true,
  "data": {
    "data": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalEntries": 0,
      "totalPages": 0,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### Examples

```bash
BASE=http://localhost:4300

# Create a company and its admin user
curl -s -X POST "$BASE/api/auth/register-company" \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Acme Inc.","email":"admin@acme.com","password":"change-me-123"}'

# Sign in and capture the access token
TOKEN=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"change-me-123"}' \
  | jq -r '.data.tokens.accessToken')

# Create a ledger account
curl -s -X POST "$BASE/api/accounts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Cash","code":"1000","type":"ASSET","currency":"USD"}'

# Read dashboard metrics
curl -s "$BASE/api/reports/dashboard" \
  -H "Authorization: Bearer $TOKEN"
```

To create a balanced journal entry, use account IDs from the same company:

```bash
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

## Accounting Rules

### Company isolation

- The company scope is derived from the access token, never from request bodies or query parameters.
- Every read and write is filtered by `companyId`.
- References to accounts, customers, and invoices are validated against the authenticated company.

### Journal entries

- An entry must contain at least two lines.
- Each line must contain exactly one positive debit or credit.
- Negative amounts are rejected.
- Total debits must equal total credits at creation and again at posting.
- All referenced accounts must be active and belong to the same company.
- New entries start as `DRAFT`; only `PATCH /api/journal/:id/post` marks them `POSTED`.
- Posting an already posted entry returns `409`.
- Only posted, non-deleted entries contribute to the trial balance.
- Trial balance rows report `debit`, `credit`, and `balance = debit - credit`.

### Payments and invoices

- Invoice totals must be positive.
- Invoice status is one of `DRAFT`, `SENT`, `PAID`, or `CANCELLED`.
- A payment can be linked to an invoice or recorded without one.
- Linked payments cannot exceed the invoice total across all existing payments.
- When cumulative payments equal the invoice total, the invoice is marked `PAID`.
- Deleting a payment does not automatically revert an invoice from `PAID`.

### Accounts

- Account codes are unique per company among active accounts.
- Account types are `ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, and `EXPENSE`.
- A parent account must be active and belong to the same company.
- An account cannot be its own parent.
- Accounts with transactions or active child accounts cannot be deleted.

### Deletion

API deletes are soft deletes. Deleted records are excluded from reads and reports, but remain in the database for auditability.

## Testing

```bash
npm test
```

The suite uses Vitest and covers authentication flows, login throttling, refresh and logout behavior, journal validation, pagination, posting, and soft deletion.

> **Warning:** The auth integration tests delete all rows from every application table before each test. Point `DATABASE_URL` at a dedicated test database before running them. Never run the suite against production data.

The journal service tests use a mocked Prisma client and do not require a database.

## Deployment

1. Provision PostgreSQL and, for multi-instance deployments, Redis.
2. Set every required environment variable on the host.
3. Build and start the service:

   ```bash
   npm ci
   npm run build
   npm start
   ```

`npm start` runs `prisma migrate deploy` before booting `dist/server.js`, so migrations are applied automatically. You can also run migrations as a separate release step.

Operational notes:

- Run at least one instance behind a reverse proxy or load balancer.
- Use Redis when running more than one instance. The in-memory fallback does not share sessions.
- Ensure the process can write to `logs/`, where Winston stores `error.log` and `combined.log`.
- CORS is not enabled. Serve the API behind the same origin as your client, or add an explicit CORS policy before exposing it to a browser application on another origin.
- Configure TLS at the proxy or platform level and use managed secrets for the JWT keys.

## Security

- Passwords are hashed with bcrypt at cost factor 10.
- Access tokens are signed JWTs with a 15-minute lifetime.
- Refresh tokens have a 7-day lifetime and are checked against the stored session on every refresh.
- Logout removes the stored refresh token.
- Login attempts are throttled by email.
- Helmet applies security headers to every response.
- Joi validates request bodies before they reach the service layer.
- Queries are scoped by the company ID from the verified token.
- Validation messages and server errors are normalized by a central error handler.

## Known Limitations

- This repository does not include a frontend.
- Monetary values use PostgreSQL `FLOAT` (Prisma `Float`). Use `Decimal` before relying on the system for regulated or high-precision accounting.
- List endpoints other than journal entries are not paginated.
- Refresh tokens are not rotated on refresh; only a new access token is issued.
- Role-based middleware exists, but routes are not yet restricted by role. Registration assigns `COMPANY_ADMIN`.
- There is no CORS configuration, OpenAPI specification, or health-check endpoint.
- There is no restore endpoint for soft-deleted records.

## Roadmap

- Migrate monetary columns to `Decimal`.
- Add invoice line items and tax calculations.
- Add per-company user management and enforced role permissions.
- Add audit logging and a restore workflow for soft-deleted records.
- Add pagination, filtering, and sorting across list endpoints.
- Add refresh-token rotation and reuse detection.
- Publish an OpenAPI specification and generated client.
- Add health and readiness endpoints.

## License

ISC. See `package.json` for details.
