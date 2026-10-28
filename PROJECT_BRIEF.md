# Project Brief

## One-Line Summary

Accounting Engine is a multi-company accounting API built with Node.js, TypeScript, Express, Prisma, and PostgreSQL for managing accounts, customers, invoices, payments, journal entries, and financial reports.

## Why This Project Matters

The project goes beyond basic CRUD by modeling real accounting concepts. It enforces double-entry rules, isolates company data, validates financial operations, and exposes consistent reporting endpoints. Each business domain is separated into its own module with clear responsibilities for routing, validation, business logic, and persistence.

## Strongest Technical Areas

- Company-scoped data access derived from authenticated JWTs.
- Double-entry journal validation and a separate posting workflow.
- Invoice and payment rules, including overpayment protection and automatic paid status.
- Trial balance reporting that only includes posted journal entries.
- Centralized validation, error handling, and structured logging.
- Optional Redis-backed sessions and login throttling with a local fallback.

## Suggested Demo Flow

1. Register a company and its admin user.
2. Sign in and capture the access token.
3. Create a small chart of accounts.
4. Add a customer and issue an invoice.
5. Record a payment and confirm the invoice status.
6. Create a balanced journal entry and post it.
7. Show the dashboard metrics and trial balance.
8. Demonstrate a validation failure, such as an unbalanced journal entry or an overpayment.

## Scope

This repository contains the backend API only. It does not include a web client. Requests can be demonstrated with curl, Postman, or any HTTP client.
