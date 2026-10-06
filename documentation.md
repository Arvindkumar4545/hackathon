# FinPilot AI architecture

FinPilot AI is a personal finance co-pilot that analyzes only transactions and goals entered by the signed-in user. It does not create sample financial records or connect to bank accounts.

## Application layers

- `index.html`, `style.css`, `app.js`: responsive dashboard, transaction workflow and co-pilot interactions.
- `financial-insights.js`: shared deterministic calculations for income/expense summaries, health score, category changes, repeated merchants, goals, scenarios and purchase checks.
- `server.js`: Express application and static frontend hosting.
- `routes/auth.js`: account creation, login and spending-limit management.
- `routes/expenses.js`: per-account income/expense transaction CRUD and monthly summary statistics.
- `routes/ai.js`: natural-language transaction parsing and grounded insight/chat endpoints.
- `models/User.js`, `models/Expense.js`: MongoDB account and transaction schemas.

## Data and persistence

Transactions belong to one authenticated account and are stored in MongoDB when connected. If MongoDB is unavailable, server memory is used temporarily; account and transaction changes are lost when the process stops. User goals and optional check-ins are stored in browser local storage under an account-specific key.

## Financial calculation behavior

- Income and expenses are separate transaction types. Net is recorded income minus recorded expenses.
- The Financial Health Doctor waits for recorded income across at least two months. Its score is a bounded, savings-rate-based signal, not a credit score.
- Category changes compare two consecutive calendar months. Repeated merchants are surfaced as items to review, not labeled unused subscriptions.
- What-if and future projections use recorded trends and constant-rate assumptions. They are estimates, not guarantees.
- Missing income, transaction history or goal dates produce explicit “not enough data” states; no financial amounts are generated to fill gaps.
- Natural-language parsing requires an explicit amount and user review before saving.

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) and [MONGODB_SETUP.md](./MONGODB_SETUP.md) for endpoint and storage details.
