# FinPilot AI

FinPilot AI is a personal finance co-pilot for understanding recorded income and expenses, spotting evidence-backed patterns, planning savings goals and comparing financial scenarios. All financial metrics are calculated from information the user enters; the app does not preload sample transactions or claim to connect to a bank.

## Run locally

Requirements: Node.js 18 or later.

```sh
npm install
cp .env.example .env
npm start
```

Open `http://localhost:5000` (or the port configured by `PORT`).

For persistent accounts and transactions, configure `MONGODB_URI` in `.env`. Without a database connection, account records and transactions are kept in server memory and will be lost when the server stops. The interface reports whether persistent storage is connected.

## Features

- Account-based transaction ledger with income/expense types, categories, payment methods, dates, search, edit and delete.
- Dashboard with recorded income, expense and net totals plus a monthly spending limit if configured.
- Financial Health Doctor, which needs income and expense activity across at least two months and explains its savings-rate-based score.
- Financial Twin answers grounded in saved transactions and goals; it states when data is missing.
- What-if estimates, purchase checks, month-end cash-flow estimates and longer-horizon scenarios. These use deterministic calculations and are explicitly estimates, not guarantees.
- Spending comparisons and repeated-merchant signals show their supporting transaction evidence. Repeated merchants are prompts to review, not claims that subscriptions are unnecessary.
- Savings goals and contribution plans. Goal details and money check-ins are saved in the signed-in browser.
- Natural-language transaction entry requires a detected amount and asks the user to review parsed data before saving.

## Configuration

Set `PORT`, `MONGODB_URI` and a private `JWT_SECRET` in `.env`. Do not commit `.env` or real financial records. See [MONGODB_SETUP.md](./MONGODB_SETUP.md) for database configuration.

## Validate

```sh
npm test
```
