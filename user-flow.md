# FinPilot AI user flow

```text
Open the app
  ├──> Sign in or create an account
  ├──> Add actual income and expense transactions
  │     ├──> Enter transaction details in the form
  │     └──> Use natural-language parsing, review the result, then save
  ├──> Explore the dashboard
  │     ├──> Review recorded income, expenses, net and category totals
  │     └──> Inspect monthly charts and the spending-limit status, if configured
  ├──> Review evidence-based tools
  │     ├──> Compare recent category changes
  │     ├──> Review repeated merchants
  │     ├──> Test a what-if scenario or purchase
  │     └──> Ask the Financial Twin about logged records and goals
  ├──> Create a savings goal and enter contributions when they actually occur
  └──> Review cash-flow and longer-horizon estimates as scenarios, not guarantees
```

The app starts without a signed-in user and without preloaded financial data. MongoDB connection status determines whether account and transaction records persist after the server stops.
