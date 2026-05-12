# Accounting Engine

Accounting Engine is a full-stack financial management system for small and growing companies. It combines a TypeScript backend with a clean vanilla HTML/CSS/JavaScript dashboard to manage the core accounting workflow: company registration, authentication, accounts, customers, invoices, payments, journal entries, and financial reports.

## Project Goal

Many small businesses start tracking their financial operations in spreadsheets, which quickly becomes hard to control as invoices, payments, accounts, and manual journal entries increase. This project aims to provide a structured accounting backend with a simple dashboard that keeps financial data organized, validated, and connected to one company workspace.

## Problem

Small teams often face the same accounting software problems:

- Financial data is spread across disconnected sheets and tools.
- Manual entries can become unbalanced or inconsistent.
- User access and company data are not clearly separated.
- Basic reports are difficult to generate from raw operational data.
- Backend projects often stop at CRUD without real business rules.

## Solution

Accounting Engine solves this by introducing a modular backend around real accounting concepts:

- Multi-company authentication and company-level data isolation.
- Chart of accounts for organizing financial records.
- Double-entry journal entries with debit and credit validation.
- Customer, invoice, and payment workflows.
- Trial balance and dashboard reporting.
- A responsive frontend dashboard served directly from the backend.

## Key Features

- Company registration with admin user creation.
- Login, logout, refresh token, and JWT authentication.
- Redis-based login rate limiting with an in-memory local fallback.
- Accounts module with account code, type, currency, and hierarchy support.
- Customers and vendors modules.
- Invoice and payment tracking.
- Journal entries with balanced debit and credit transactions.
- Trial balance report based on posted journal entries.
- Dashboard metrics for accounts, customers, invoices, paid amount, and open balance.
- Responsive vanilla frontend with dark and light mode.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- Vitest
- Docker

## Architecture

The backend follows a simple module-based structure:

```text
src
  modules
    auth
    accounts
    customers
    vendors
    invoices
    payments
    journal
    reports
  middlewares
  config
  utils
  types
frontend
  index.html
  styles.css
  app.js
prisma
  schema.prisma
```

Each business module is organized around:

- `validation`: request schema and input types.
- `service`: business logic and database operations.
- `controller`: HTTP request and response handling.
- `routes`: API route registration.

## API Overview

```text
POST   /api/auth/register-company
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh

GET    /api/accounts
POST   /api/accounts
PATCH  /api/accounts/:id
DELETE /api/accounts/:id

GET    /api/customers
POST   /api/customers
PATCH  /api/customers/:id
DELETE /api/customers/:id

GET    /api/vendors
POST   /api/vendors
PATCH  /api/vendors/:id
DELETE /api/vendors/:id

GET    /api/invoices
POST   /api/invoices
PATCH  /api/invoices/:id
DELETE /api/invoices/:id

GET    /api/payments
POST   /api/payments
DELETE /api/payments/:id

GET    /api/journal
POST   /api/journal
PATCH  /api/journal/:id/post
DELETE /api/journal/:id

GET    /api/reports/dashboard
GET    /api/reports/trial-balance
```

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```bash
PORT=4300
DATABASE_URL="postgresql://user:password@localhost:5432/accounting_engine"
JWT_SECRET="your_access_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
REDIS_URL="redis://localhost:6379"
```

Run database migrations:

```bash
npx prisma migrate dev
```

Start the development server:

```bash
npm run dev
```

Open the frontend:

```bash
http://localhost:4300
```

Run tests:

```bash
npm run test
```

Build for production:

```bash
npm run build
```

Start production server:

```bash
npm start
```

## Deployment

The project can be deployed for free using Render, Supabase, and Upstash:

- Render hosts the Node.js web service and serves the frontend.
- Supabase provides the PostgreSQL database.
- Upstash provides Redis for sessions and rate limiting.

Full deployment steps are available in [DEPLOYMENT.md](./DEPLOYMENT.md).

## Frontend

The frontend is intentionally built with vanilla HTML, CSS, and JavaScript. It includes:

- Login and register screens.
- Company-branded dashboard after login.
- Dark and light mode with saved user preference.
- Responsive sidebar navigation.
- Dashboard metric cards.
- Forms for accounts, customers, invoices, payments, and journal entries.
- Lists and trial balance display connected to the backend API.

## Accounting Rules Implemented

- A journal entry must contain at least two transactions.
- Every transaction must be either debit or credit, not both.
- Total debit must equal total credit before a journal entry is created.
- Accounts must belong to the same company as the authenticated user.
- Posted journal entries are used in the trial balance report.
- Payments cannot exceed the invoice total.

## Testing

The project uses Vitest for unit and integration tests. Current test coverage focuses on:

- Authentication flow.
- Register, login, logout, and refresh token behavior.
- Journal entry business rules.
- Balanced and unbalanced transaction validation.
- Posting and soft deletion flows.

## Current Status

This project is an ongoing learning-focused backend system. It is built to be clean, understandable, and realistic without being over-engineered. The current version is suitable as a portfolio project and as a strong base for adding more advanced accounting features.

## Future Improvements

- Use decimal database types for financial precision.
- Add invoice line items.
- Add user management inside each company.
- Add audit logs.
- Add account statements and general ledger report.
- Add role-based permissions across modules.
- Add Docker setup for PostgreSQL and Redis.
- Add API documentation using Swagger or a Postman collection.

## Author Notes

This project was designed as a practical backend engineering exercise focused on real business logic, data validation, authentication, and clean modular structure. The goal is to demonstrate the ability to build more than simple CRUD APIs by modeling a real accounting workflow.
