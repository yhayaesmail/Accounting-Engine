# Accounting Engine

A full-stack financial management system for small and growing businesses. It pairs a modular TypeScript/Express backend with a lightweight vanilla HTML, CSS, and JavaScript dashboard to cover the core accounting workflow — company registration, authentication, chart of accounts, customers, invoices, payments, journal entries, and financial reporting.

## Table of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Deployment](#deployment)
- [Accounting Business Rules](#accounting-business-rules)
- [Frontend](#frontend)
- [Security](#security)
- [Roadmap](#roadmap)
- [Author Notes](#author-notes)

---

## Project Overview

Many small companies begin managing their finances in spreadsheets. As invoices, payments, accounts, and manual journal entries grow, that approach becomes difficult to control and audit. Accounting Engine provides a structured, validated, and company-scoped backend with a simple dashboard so financial data stays organized, consistent, and connected to a single company workspace.

## Problem Statement

Small teams commonly face the following accounting software challenges:

- Financial data scattered across disconnected spreadsheets and tools.
- Manual journal entries that are unbalanced or inconsistent.
- No clear separation between user access and company data.
- Basic reporting is hard to produce from raw operational data.
- Backend projects stop at CRUD without modeling real business rules.

## Solution

Accounting Engine addresses these problems with a modular backend built around real accounting concepts:

- **Multi-company authentication** with company-level data isolation.
- **Chart of accounts** for organizing financial records.
- **Double-entry journal entries** with enforced debit/credit balancing.
- **Customer, invoice, and payment** workflows.
- **Trial balance and dashboard reporting** over posted entries.
- **Responsive dashboard** served directly by the backend.

## Key Features

- Company registration with admin user creation.
- Full JWT authentication: register, login, logout, and refresh-token flow.
- Redis-backed login rate limiting with an in-memory local fallback.
- Chart of accounts with account code, type, currency, and hierarchy support.
- Customers, vendors, invoices, and payments modules.
- Double-entry journal with balanced debit/credit validation and posting.
- Trial balance report derived from posted journal entries.
- Dashboard metrics: accounts, customers, invoices, paid amount, and open balance.
- Responsive vanilla frontend with dark/light mode.

## Tech Stack

| Layer       | Technology                                          |
| ----------- | --------------------------------------------------- |
| Runtime     | Node.js >= 22                                        |
| Framework   | Express.js                                           |
| Language    | TypeScript                                           |
| ORM         | Prisma                                               |
| Database    | PostgreSQL                                           |
| Cache       | Redis (sessions, rate limiting)                      |
| Validation  | Joi                                                  |
| Testing     | Vitest                                               |

## Architecture

The backend follows a clean, module-based structure where each business domain lives in its own folder:

```text
src
├── modules
│   ├── auth
│   ├── accounts
│   ├── customers
│   ├── vendors
│   ├── invoices
│   ├── payments
│   ├── journal
│   └── reports
├── middlewares      # auth, role, error handling
├── config           # env, prisma, redis
├── utils            # jwt, hashing, logger, errors
├── types
└── server.ts
```

Each module is organized around the same responsibilities:

- `validation` — request schemas and input types (Joi).
- `service` — business logic and database operations.
- `controller` — HTTP request/response handling.
- `routes` — route registration and middleware wiring.

## API Reference

### Authentication

| Method | Endpoint               | Description                | Auth |
| ------ | ---------------------- | -------------------------- | ---- |
| POST   | `/api/auth/register-company` | Register a company + admin | No   |
| POST   | `/api/auth/login`      | Login and receive tokens   | No   |
| POST   | `/api/auth/refresh`    | Rotate an access token     | No   |
| POST   | `/api/auth/logout`     | Invalidate the session     | Yes  |

### Core Modules

| Method | Endpoint                  | Description                       | Auth |
| ------ | ------------------------- | --------------------------------- | ---- |
| GET    | `/api/accounts`           | List accounts                     | Yes  |
| POST   | `/api/accounts`           | Create an account                 | Yes  |
| PATCH  | `/api/accounts/:id`       | Update an account                 | Yes  |
| DELETE | `/api/accounts/:id`       | Delete an account                 | Yes  |
| GET    | `/api/customers`          | List customers                    | Yes  |
| POST   | `/api/customers`          | Create a customer                 | Yes  |
| PATCH  | `/api/customers/:id`      | Update a customer                 | Yes  |
| DELETE | `/api/customers/:id`      | Delete a customer                 | Yes  |
| GET    | `/api/vendors`            | List vendors                      | Yes  |
| POST   | `/api/vendors`            | Create a vendor                   | Yes  |
| PATCH  | `/api/vendors/:id`        | Update a vendor                   | Yes  |
| DELETE | `/api/vendors/:id`        | Delete a vendor                   | Yes  |
| GET    | `/api/invoices`           | List invoices                     | Yes  |
| POST   | `/api/invoices`           | Create an invoice                 | Yes  |
| PATCH  | `/api/invoices/:id`       | Update an invoice                 | Yes  |
| DELETE | `/api/invoices/:id`       | Delete an invoice                 | Yes  |
| GET    | `/api/payments`           | List payments                     | Yes  |
| POST   | `/api/payments`           | Record a payment                  | Yes  |
| DELETE | `/api/payments/:id`       | Delete a payment                  | Yes  |
| GET    | `/api/journal`            | List journal entries              | Yes  |
| POST   | `/api/journal`            | Create a journal entry            | Yes  |
| PATCH  | `/api/journal/:id/post`   | Post a journal entry              | Yes  |
| DELETE | `/api/journal/:id`        | Delete a journal entry            | Yes  |

### Reports

| Method | Endpoint                       | Description              | Auth |
| ------ | ------------------------------ | ------------------------ | ---- |
| GET    | `/api/reports/dashboard`       | Dashboard metrics        | Yes  |
| GET    | `/api/reports/trial-balance`   | Trial balance            | Yes  |

## Getting Started

### Prerequisites

- Node.js >= 22
- PostgreSQL
- Redis

### Installation

1. Clone the repository.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file — see [Environment Variables](#environment-variables).
4. Run database migrations:

   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open the dashboard:

   ```text
   http://localhost:4300
   ```

### Production

```bash
npm run build
npm start
```

`npm start` applies pending migrations (`prisma migrate deploy`) and boots the compiled server.

## Environment Variables

| Variable                | Required | Description                          |
| ----------------------- | -------- | ------------------------------------ |
| `PORT`                  | No       | Server port (default: `3000`)        |
| `DATABASE_URL`          | Yes      | PostgreSQL connection string         |
| `JWT_SECRET`            | Yes      | Access-token signing secret          |
| `JWT_REFRESH_SECRET`    | Yes      | Refresh-token signing secret         |
| `REDIS_URL`             | No       | Redis connection URL (sessions/rate limiting) |

Example:

```bash
PORT=4300
DATABASE_URL="postgresql://user:password@localhost:5432/accounting_engine"
JWT_SECRET="your_access_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
REDIS_URL="redis://localhost:6379"
```

## Testing

The project uses Vitest for unit and integration tests. Current coverage focuses on:

- Authentication flow (register, login, logout, refresh token).
- Journal entry business rules.
- Balanced and unbalanced transaction validation.
- Posting and soft-deletion flows.

Run the test suite:

```bash
npm run test
```

## Deployment

The application is designed to run on managed services with a free tier:

- **Render** — hosts the Node.js web service and serves the frontend.
- **Supabase** — provides the PostgreSQL database.
- **Upstash** — provides Redis for sessions and rate limiting.

For local containerized development, PostgreSQL and Redis are run via their standard Docker images.

## Accounting Business Rules

The engine enforces the following rules to keep the books accurate:

- A journal entry must contain at least two transactions.
- Each transaction is either a debit or a credit — never both.
- Total debits must equal total credits before a journal entry is created.
- Accounts must belong to the same company as the authenticated user.
- Only posted journal entries contribute to the trial balance.
- Payments cannot exceed the invoice total.

## Frontend

The frontend is intentionally built with vanilla HTML, CSS, and JavaScript — no framework overhead. It includes:

- Login and registration screens.
- Company-branded dashboard after authentication.
- Dark and light mode with a saved user preference.
- Responsive sidebar navigation.
- Dashboard metric cards.
- Forms for accounts, customers, invoices, payments, and journal entries.
- Data lists and a trial balance view wired to the backend API.

## Security

- JWT access tokens (short-lived) with refresh-token sessions stored in Redis.
- Passwords hashed with bcrypt.
- Joi request validation across all modules.
- Login rate limiting via Redis.
- Security headers enforced through Helmet.

## Roadmap

- Decimal database types for financial precision.
- Invoice line items.
- Per-company user management.
- Audit logging.
- Account statements and general ledger reports.
- Expanded role-based permissions across modules.
- Swagger / OpenAPI documentation.

## Author Notes

This project was designed as a practical backend engineering exercise focused on real business logic, data validation, authentication, and clean modular structure. The goal is to demonstrate the ability to build more than simple CRUD APIs by modeling a real accounting workflow.

Frontend made by help of AI (GPT - DEEPSEEK - GM)
