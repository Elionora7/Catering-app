# Full-Stack Ordering & Operations Platform

A production-oriented web application for browsing a catalog, managing a cart, placing orders with delivery scheduling, and supporting administrative workflows. Built as a portfolio-grade full-stack TypeScript project with explicit separation between UI, API routes, and persistence.

## Technology Stack

| Layer | Technologies |
|--------|----------------|
| **Frontend** | Next.js (App Router), React, TypeScript, Tailwind CSS |
| **Data & API** | Next.js Route Handlers, TanStack React Query, Zod |
| **Authentication** | NextAuth.js (JWT session strategy), bcrypt password hashing |
| **Database** | PostgreSQL via Prisma ORM |
| **Payments** | Stripe (Payment Intents), server-side verification before order persistence |
| **Email** | Nodemailer (transactional notifications where configured) |

## Implemented Capabilities

- **Catalog & browsing** — Menu listing with category-oriented navigation and client-side cart state persisted locally.
- **Checkout** — Stripe Elements–based card flow; totals and eligibility computed on the server; guest checkout supported alongside authenticated sessions.
- **Orders** — Order creation API with validated payloads, centralized pricing logic, and alignment between charged amounts and persisted order totals for card payments.
- **Authorization** — Protected APIs for privileged actions (e.g. administrative routes) using session-backed identity checks.
- **Operational APIs** — Quote/request and order-related endpoints with schema validation and structured error responses.
- **Hardening** — Rate limiting on selected APIs, security-oriented HTTP headers (e.g. CSP, HSTS, framing controls), and minimized sensitive logging in production-oriented paths.
- **Discoverability** — Metadata, sitemap, and crawl directives suitable for public marketing routes.

## Engineering Highlights

- Type-safe database access with Prisma and migration-driven schema evolution.
- Request validation with Zod across critical API surfaces.
- Component-based UI with responsive layout patterns.

## Scope

This repository represents a complete client–server application: interactive frontend, serverless-style backend routes, relational data model, and third-party integrations suitable for real deployment scenarios.
