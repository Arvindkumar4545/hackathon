# FinPilot AI solution

FinPilot AI turns a user’s own transaction history into understandable financial context. It combines transaction entry, explainable calculations and scenario planning in one responsive workspace.

## Core experience

1. Record real income and expenses by amount, date, category, payment method and note.
2. Review monthly totals and category distribution on the dashboard.
3. Use the Financial Health Doctor, spending analysis and Financial Twin to understand recorded activity.
4. Create personal savings goals, test monthly changes and check purchases against recorded net income.
5. Treat cash-flow and longer-term projections as estimates, with assumptions and data gaps stated.

No sample financial records are loaded. The server reports when MongoDB is unavailable and financial records are then temporary until it stops.

## Implementation

- Express and MongoDB provide authentication and per-account transaction persistence.
- Shared deterministic calculations prevent an LLM from inventing financial values.
- Natural-language parsing is a convenience for entering transactions; the user reviews parsed details before saving.
- Health, purchase and cash-flow outputs are not credit scores, financial advice or guaranteed outcomes.
