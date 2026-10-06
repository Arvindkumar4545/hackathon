# FinPilot AI API

Base URL: `http://localhost:5000/api`

Financial endpoints use user-entered records only. There are no seeded accounts, transactions or public benchmark figures.

## Status

### `GET /public/status`

Returns MongoDB connection state and whether account records are persistent.

### `GET /public/overview`

Returns the product name and storage status. It contains no personal or example financial metrics.

## Authentication

### `POST /auth/signup`

Request:

```json
{
  "name": "Your name",
  "email": "you@example.com",
  "password": "choose-a-password",
  "monthlyBudget": 0
}
```

`monthlyBudget` is optional. The response includes a JWT and account profile.

### `POST /auth/login`

Accepts `email` and `password`; returns a JWT and profile.

### `PUT /auth/budget`

Requires `Authorization: Bearer <token>`. Updates the optional monthly spending limit and returns a refreshed JWT.

## Transactions

All transaction endpoints require authentication.

### `GET /expenses`

Returns the signed-in account’s transactions. Optional filters: `month=YYYY-MM`, `category`, and `search`.

### `POST /expenses`

Creates an income or expense transaction.

```json
{
  "amount": 1250,
  "category": "Salary",
  "type": "income",
  "note": "Monthly salary",
  "date": "2026-10-06",
  "paymentMethod": "UPI"
}
```

Supported categories: Food, Transport, Education, Entertainment, Shopping, Health, Utilities, Rent, Bills, Salary and Other. Supported payment methods: UPI, Cash, Card, NetBanking and Other.

### `PUT /expenses/:id`

Updates one transaction owned by the signed-in account.

### `DELETE /expenses/:id`

Deletes one transaction owned by the signed-in account.

### `GET /expenses/stats`

Returns this month’s recorded income, expenses, net, budget use and expense-category breakdown.

## Financial analysis

### `POST /ai/parse`

Parses text containing an explicit amount and description. It returns `400` when an amount is missing rather than inventing one.

### `POST /ai/insights`

Accepts `transactions` and optional `budget`, and returns deterministic health, category-pattern, repeated-merchant and cash-flow calculations. Repeated merchants are review prompts, not claims of unused subscriptions.

### `POST /ai/chat`

Accepts a question and a `context` object containing the caller’s transactions, goals and optional budget. Replies are calculation- and rule-based; unavailable data is called out rather than guessed.

Longer-term projections and purchase checks are exposed in the web interface and are explicitly estimates, not guarantees or financial advice.

## Persistence note

Set `MONGODB_URI` to enable persistent accounts and transactions. If MongoDB is unavailable, the server reports that data is temporary and retains in-memory account/transaction state only until it stops.
